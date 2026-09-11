import { Audio } from "expo-av";
import { Platform } from "react-native";

let sound: Audio.Sound | null = null;
let loaded = false;

export async function loadNotificationSound() {
  if (loaded) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound: s } = await Audio.Sound.createAsync(
      require("../../assets/sounds/notification.wav"),
    );
    sound = s;
    loaded = true;
  } catch {
    sound = null;
  }
}

export async function playNotificationSound() {
  try {
    if (!sound) await loadNotificationSound();
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch {
    // silent
  }
}

export async function unloadNotificationSound() {
  if (sound) {
    try {
      await sound.unloadAsync();
    } catch {}
    sound = null;
    loaded = false;
  }
}
