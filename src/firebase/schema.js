// src/firebase/schema.js
// =====================================================
// FIRESTORE DATABASE SCHEMA - WorkforcePro
// =====================================================

/*
COLLECTION: employees
Document ID: uid (from Firebase Auth)
{
  uid: string,
  name: string,
  email: string,
  role: "admin" | "employee",
  department: string,          // "Engineering" | "Design" | "Marketing" | "HR" | "Sales"
  photoURL: string,            // Firebase Storage URL
  joinDate: timestamp,
  isActive: boolean,
  productivityScore: number,   // Calculated score 0-100
  createdAt: timestamp,
  updatedAt: timestamp
}

COLLECTION: attendance
Document ID: auto-generated
{
  employeeId: string,
  employeeName: string,
  date: string,                // "YYYY-MM-DD"
  checkInTime: timestamp | null,
  checkOutTime: timestamp | null,
  totalHours: number,
  status: "present" | "late" | "absent",
  createdAt: timestamp
}

COLLECTION: tasks
Document ID: auto-generated
{
  title: string,
  description: string,
  priority: "low" | "medium" | "high" | "urgent",
  deadline: timestamp,
  assignedTo: string,          // employee uid
  assignedToName: string,
  assignedBy: string,          // admin uid
  status: "pending" | "in_progress" | "completed",
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: timestamp | null
}

COLLECTION: leaves
Document ID: auto-generated
{
  employeeId: string,
  employeeName: string,
  leaveType: "sick" | "casual" | "half_day" | "wfh" | "emergency",
  date: string,                // "YYYY-MM-DD"
  reason: string,
  status: "pending" | "approved" | "rejected",
  reviewedBy: string | null,   // admin uid
  reviewedAt: timestamp | null,
  createdAt: timestamp
}

COLLECTION: notifications
Document ID: auto-generated
{
  userId: string,              // recipient
  title: string,
  message: string,
  type: "task_assigned" | "leave_approved" | "leave_rejected" | "deadline_approaching",
  isRead: boolean,
  relatedId: string | null,    // task or leave ID
  createdAt: timestamp
}

COLLECTION: settings (single doc: "global")
{
  defaultCheckInDeadline: string,   // "HH:MM" e.g. "10:00"
  dayOverrides: {
    "YYYY-MM-DD": string            // custom deadline per day
  },
  updatedAt: timestamp
}
*/