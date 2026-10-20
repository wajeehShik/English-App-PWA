export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("المتصفح لا يدعم الإشعارات.");
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("لم يتم منح إذن الإشعارات.");
  }

  return true;
}

export async function showNotification(title, options = {}) {
  await requestNotificationPermission();
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }

  return true;
}
