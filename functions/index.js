const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ─────────────────────────────────────────────
// HELPER — Send push to a single token
// ─────────────────────────────────────────────
const sendPush = async (token, title, body, url = '/dashboard', type = 'general') => {
  if (!token) return;
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data: { type, url },
      webpush: {
        notification: {
          title,
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: { link: url }
      }
    });
    console.log(`✅ Push sent to token: ${token.slice(0, 20)}...`);
  } catch (err) {
    // Token expired or invalid — remove it from Firestore
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
      console.log('🗑️  Invalid token, removing from Firestore');
      const snap = await db.collection('employees')
        .where('deviceToken', '==', token).get();
      snap.docs.forEach(d => d.ref.update({ deviceToken: null }));
    } else {
      console.error('Push error:', err.message);
    }
  }
};

// ─────────────────────────────────────────────
// HELPER — Send push to multiple tokens (batch)
// ─────────────────────────────────────────────
const sendPushToMany = async (tokens, title, body, url = '/dashboard', type = 'general') => {
  if (!tokens || tokens.length === 0) return;

  // FCM allows max 500 tokens per multicast
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: { type, url },
        webpush: {
          notification: {
            title,
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            vibrate: [200, 100, 200],
          },
          fcmOptions: { link: url }
        }
      });

      // Clean up invalid tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            const invalidToken = chunk[idx];
            db.collection('employees')
              .where('deviceToken', '==', invalidToken)
              .get()
              .then(snap => snap.docs.forEach(d => d.ref.update({ deviceToken: null })));
          }
        }
      });

      console.log(`✅ Batch sent: ${response.successCount} success, ${response.failureCount} failed`);
    } catch (err) {
      console.error('Batch push error:', err);
    }
  }
};

// ─────────────────────────────────────────────
// TRIGGER 1 — New Announcement Posted
// ─────────────────────────────────────────────
exports.onAnnouncementCreated = functions.firestore
  .document('announcements/{docId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data) return null;

    console.log('📢 New announcement:', data.title);

    // Get all active employees with device tokens
    const empSnap = await db.collection('employees')
      .where('isActive', '==', true)
      .get();

    const tokens = [];
    empSnap.docs.forEach(doc => {
      const emp = doc.data();
      // Don't notify the admin who posted it
      if (emp.deviceToken && doc.id !== data.createdBy) {
        tokens.push(emp.deviceToken);
      }
    });

    if (tokens.length === 0) {
      console.log('No tokens found');
      return null;
    }

    const title = `📢 ${data.title}`;
    const body = data.message.length > 100
      ? data.message.slice(0, 100) + '...'
      : data.message;

    await sendPushToMany(tokens, title, body, '/announcements', 'announcement');

    console.log(`✅ Announcement push sent to ${tokens.length} employees`);
    return null;
  });

// ─────────────────────────────────────────────
// TRIGGER 2 — Task Assigned to Employee
// ─────────────────────────────────────────────
exports.onTaskCreated = functions.firestore
  .document('tasks/{docId}')
  .onCreate(async (snap) => {
    const task = snap.data();
    if (!task || !task.assignedTo) return null;

    console.log('✅ New task assigned to:', task.assignedToName);

    // Get employee device token
    const empDoc = await db.collection('employees')
      .doc(task.assignedTo).get();

    if (!empDoc.exists) return null;

    const token = empDoc.data()?.deviceToken;
    if (!token) {
      console.log('No device token for employee');
      return null;
    }

    await sendPush(
      token,
      '✅ New Task Assigned',
      `You have a new task: "${task.title}"`,
      '/tasks',
      'task_assigned'
    );

    return null;
  });

// ─────────────────────────────────────────────
// TRIGGER 3 — Leave Request Approved or Rejected
// ─────────────────────────────────────────────
exports.onLeaveStatusChanged = functions.firestore
  .document('leaves/{docId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after  = change.after.data();

    // Only trigger when status actually changes
    if (before.status === after.status) return null;

    // Only care about approved or rejected
    if (after.status !== 'approved' && after.status !== 'rejected') return null;

    console.log(`📋 Leave ${after.status} for:`, after.employeeName);

    // Get employee device token
    const empDoc = await db.collection('employees')
      .doc(after.employeeId).get();

    if (!empDoc.exists) return null;

    const token = empDoc.data()?.deviceToken;
    if (!token) return null;

    const isApproved = after.status === 'approved';

    await sendPush(
      token,
      isApproved ? '✅ Leave Approved!' : '❌ Leave Rejected',
      `Your leave request for ${after.date} has been ${after.status}.`,
      '/leave',
      `leave_${after.status}`
    );

    return null;
  });

// ─────────────────────────────────────────────
// TRIGGER 4 — Task Deadline Approaching (24 hrs)
// Runs every day at 9 AM IST (3:30 AM UTC)
// ─────────────────────────────────────────────
exports.checkTaskDeadlines = functions.pubsub
  .schedule('30 3 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    console.log('⏰ Checking task deadlines...');

    const now = new Date();
    const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get all pending/in-progress tasks
    const tasksSnap = await db.collection('tasks')
      .where('status', 'in', ['pending', 'in_progress'])
      .get();

    if (tasksSnap.empty) {
      console.log('No pending tasks');
      return null;
    }

    const notifyMap = {}; // employeeId → [task titles]

    tasksSnap.docs.forEach(doc => {
      const task = doc.data();
      if (!task.deadline || !task.assignedTo) return;

      const deadline = task.deadline.toDate
        ? task.deadline.toDate()
        : new Date(task.deadline);

      // Check if deadline is within next 24 hours
      if (deadline >= now && deadline <= in24hrs) {
        if (!notifyMap[task.assignedTo]) {
          notifyMap[task.assignedTo] = [];
        }
        notifyMap[task.assignedTo].push(task.title);
      }
    });

    if (Object.keys(notifyMap).length === 0) {
      console.log('No deadlines approaching');
      return null;
    }

    // Send push to each employee
    const promises = Object.entries(notifyMap).map(async ([employeeId, titles]) => {
      const empDoc = await db.collection('employees').doc(employeeId).get();
      if (!empDoc.exists) return;

      const token = empDoc.data()?.deviceToken;
      if (!token) return;

      const taskWord = titles.length === 1 ? 'task' : 'tasks';
      const body = titles.length === 1
        ? `"${titles[0]}" is due within 24 hours!`
        : `${titles.length} ${taskWord} due within 24 hours!`;

      await sendPush(
        token,
        '⏰ Deadline Approaching',
        body,
        '/tasks',
        'deadline_approaching'
      );
    });

    await Promise.all(promises);
    console.log(`✅ Deadline notifications sent to ${Object.keys(notifyMap).length} employees`);
    return null;
  });