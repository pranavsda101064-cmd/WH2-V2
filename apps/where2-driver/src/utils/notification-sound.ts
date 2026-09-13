// expo-av removed — its prebuilt .so is arm-v7a only, which crashes on arm64-v8a builds.
// Notification sound is handled by expo-notifications via shouldPlaySound: true
// in the notification handler (_layout.tsx). These stubs are kept for API compatibility.

export async function loadNotificationSound() {}
export async function playNotificationSound() {}
export async function unloadNotificationSound() {}
