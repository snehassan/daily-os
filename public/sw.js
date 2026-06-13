self.addEventListener("push", function (event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "Daily OS", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Daily OS", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/" },
      vibrate: [100, 50, 100],
      actions: [{ action: "open", title: "Open Schedule" }],
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.includes(self.location.origin)) {
          windowClients[i].navigate(url);
          return windowClients[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
