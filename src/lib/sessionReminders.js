// Planned-session reminders: once per training day at the chosen time, the
// user gets the notification sound plus an OS notification naming today's
// scheduled workout. This is an in-page scheduler — it fires while the app is
// open or backgrounded, but not when the PWA is fully closed (no push server).
import { loadSettings, loadLastReminderDay, saveLastReminderDay } from './storage';
import { getTodaySchedule, getPlanLedWorkoutRecommendation } from './trainingLogic';
import { playNotificationSound } from './workoutFeedback';

export const localDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseReminderTime = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
  if (!match) return { hours: 8, minutes: 0 };
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return { hours, minutes };
};

// Today's planned session, or null on rest days (no reminder then).
export const getTodayPlannedSession = (date = new Date()) => {
  const today = getTodaySchedule(date);
  if (!today?.workoutId) return null;
  const recommendation = getPlanLedWorkoutRecommendation(undefined, date);
  if (!recommendation?.workoutId) return null;
  return {
    workoutId: recommendation.workoutId,
    workoutName: recommendation.workoutName,
    scheduledDay: today.day,
  };
};

export const isReminderDue = (now = new Date()) => {
  const settings = loadSettings();
  if (!settings.notifications) return false;
  const { hours, minutes } = parseReminderTime(settings.reminderTime);
  const dueAt = new Date(now);
  dueAt.setHours(hours, minutes, 0, 0);
  if (now < dueAt) return false;
  if (loadLastReminderDay() === localDayKey(now)) return false;
  return !!getTodayPlannedSession(now);
};

const showOsNotification = async (title, body) => {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/apex-mark.svg',
          badge: '/apex-mark.svg',
          tag: 'apex-session-reminder',
          data: { url: '/' },
        });
        return;
      }
    }
    new Notification(title, { body, icon: '/apex-mark.svg', tag: 'apex-session-reminder' });
  } catch {
    // Notifications are an enhancement; failure to show one stays silent.
  }
};

// Fires the reminder for `date`. Returns the planned session, or null when
// there is nothing to remind about (rest day / already sent today).
export const fireSessionReminder = async (date = new Date()) => {
  const planned = getTodayPlannedSession(date);
  if (!planned) return null;
  saveLastReminderDay(localDayKey(date));
  playNotificationSound();
  await showOsNotification(
    'APEX — training day',
    `Today's session: ${planned.workoutName}. Tap to open APEX.`,
  );
  return planned;
};

// Checks whether the reminder is due right now and fires it if so.
// Returns the planned session when a reminder fired, otherwise null.
export const maybeFireSessionReminder = async (now = new Date()) => {
  if (!isReminderDue(now)) return null;
  return fireSessionReminder(now);
};

export const requestNotificationPermission = async () => {
  try {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

export const getNotificationPermission = () => {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};
