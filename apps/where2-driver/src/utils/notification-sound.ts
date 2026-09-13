import { Platform } from "react-native";

let sound: any = null;
let loaded = false;
let Audio: any = null;

function getAudio() {
  if (!Audio) Audio = require("expo-av").Audio;
  return Audio;
}

export async function loadNotificationSound() {
  if (loaded) return;
  try {
    const audio = getAudio();
    await audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound: s } = await audio.Sound.createAsync(
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
