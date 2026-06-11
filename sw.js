// sw.js — Deutsch Daily Service Worker

const CACHE = 'deutsch-daily-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Listen for messages from the main app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { time, message } = e.data;
    scheduleDaily(time, message);
  }
  if (e.data && e.data.type === 'CANCEL_NOTIFICATION') {
    clearScheduled();
  }
});

// Store timer id in SW scope
let scheduledTimer = null;

function clearScheduled() {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

function scheduleDaily(timeStr, message) {
  clearScheduled();

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  scheduledTimer = setTimeout(() => {
    fireNotification(message);
    // Re-schedule for the next day
    scheduleDaily(timeStr, message);
  }, delay);
}

function fireNotification(message) {
  self.registration.showNotification('Deutsch Daily 🇩🇪', {
    body: message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'deutsch-daily-reminder',
    renotify: true,
    data: { url: self.registration.scope }
  });
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope);
      }
    })
  );
});
