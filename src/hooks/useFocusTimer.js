import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  startFocusSession, stopFocusSession,
  getActiveFocusSession, getTodayFocusTime
} from '../services/focusService';
import { logActivity } from '../services/activityService';
import toast from 'react-hot-toast';

export function useFocusTimer() {
  const { currentUser, userProfile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Load active session on mount
  useEffect(() => {
    if (!currentUser) return;
    loadState();
  }, [currentUser]);

  // Tick timer
  useEffect(() => {
    if (isActive && startTime) {
      intervalRef.current = setInterval(() => {
        const s = startTime?.toDate ? startTime.toDate() : new Date(startTime);
        setElapsed(Math.floor((Date.now() - s.getTime()) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, startTime]);

  const loadState = async () => {
    setLoading(true);
    const [active, todayMins] = await Promise.all([
      getActiveFocusSession(currentUser.uid),
      getTodayFocusTime(currentUser.uid)
    ]);
    if (active) {
      setIsActive(true);
      setSessionId(active.id);
      setStartTime(active.focusStartTime);
      const s = active.focusStartTime?.toDate ? active.focusStartTime.toDate() : new Date();
      setElapsed(Math.floor((Date.now() - s.getTime()) / 1000));
    }
    setTodayMinutes(todayMins);
    setLoading(false);
  };

  const startFocus = async () => {
    try {
      const id = await startFocusSession(currentUser.uid, userProfile?.name);
      const now = new Date();
      setSessionId(id);
      setStartTime(now);
      setIsActive(true);
      setElapsed(0);
      await logActivity(currentUser.uid, userProfile?.name, 'focus_start', `${userProfile?.name} started focus mode`);
      toast.success('🎯 Focus mode started!');
    } catch {
      toast.error('Failed to start focus');
    }
  };

  const stopFocus = async () => {
    if (!sessionId || !startTime) return;
    try {
      const mins = await stopFocusSession(sessionId, startTime);
      setIsActive(false);
      setSessionId(null);
      setStartTime(null);
      setElapsed(0);
      setTodayMinutes(prev => prev + mins);
      await logActivity(currentUser.uid, userProfile?.name, 'focus_stop',
        `${userProfile?.name} completed ${mins} min focus session`,
        { duration: mins }
      );
      toast.success(`✅ Focus session: ${mins} minutes logged!`);
    } catch {
      toast.error('Failed to stop focus');
    }
  };

  // Format elapsed seconds → HH:MM:SS
  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Format minutes → "Xh Ym"
  const formatMinutes = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return {
    isActive, elapsed, todayMinutes, loading,
    startFocus, stopFocus, formatTimer, formatMinutes
  };
}