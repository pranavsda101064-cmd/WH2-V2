import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

import { colors, radius } from "@/src/theme";
import { api, getUserName } from "@/src/api";
import { LoadingScreen } from "@/src/components/loading";

const { width: SCREEN_W } = Dimensions.get("window");
const AVATAR_SIZE = Math.round((SCREEN_W - 80) / 4);

const AVATARS = [
  { id: "m1", label: "Boy 1", gender: "male", color: "#4A90D9" },
  { id: "m2", label: "Boy 2", gender: "male", color: "#5BA55B" },
  { id: "m3", label: "Boy 3", gender: "male", color: "#D4A03C" },
  { id: "m4", label: "Boy 4", gender: "male", color: "#8B5CF6" },
  { id: "f1", label: "Girl 1", gender: "female", color: "#E8618C" },
  { id: "f2", label: "Girl 2", gender: "female", color: "#F59E0B" },
  { id: "f3", label: "Girl 3", gender: "female", color: "#06B6D4" },
  { id: "f4", label: "Girl 4", gender: "female", color: "#EC4899" },
];

type Step = 1 | 2 | 3;

export default function ProfileSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserName().then((n) => {
      if (n) setName(n);
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCustomAvatar(result.assets[0].uri);
      setSelectedAvatar(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCustomAvatar(result.assets[0].uri);
      setSelectedAvatar(null);
    }
  };

  const handleStep1Next = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleStep2Next = async () => {
    setSaving(true);
    setError("");
    try {
      let avatarUrl: string | undefined;

      if (customAvatar) {
        const ext = customAvatar.split(".").pop() || "jpg";
        const uploadResult = await api.uploadAvatar({
          uri: customAvatar,
          type: `image/${ext}`,
          name: `avatar.${ext}`,
        });
        avatarUrl = uploadResult.avatar_url;
      } else if (selectedAvatar) {
        avatarUrl = `/avatars/${selectedAvatar}.png`;
      }

      await api.updateProfile({
        full_name: name.trim(),
        phone: phone.trim(),
        gender: gender || undefined,
        avatar_url: avatarUrl,
      });

      setStep(3);
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.root} testID="profile-setup-screen">
      <StatusBar style="light" />

      {/* Progress dots */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 12 }]}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step && styles.progressDotActive,
              s === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>We'll use this to personalize your experience</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textDim}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Gender (optional)</Text>
              <View style={styles.genderRow}>
                {(["male", "female", "other"] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g === gender ? "" : g)}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g === "male" ? "Male" : g === "female" ? "Female" : "Other"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.nextBtn} onPress={handleStep1Next}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Avatar */}
        {step === 2 && (
          <>
            <Text style={styles.title}>Choose your avatar</Text>
            <Text style={styles.subtitle}>Pick an avatar or upload your own photo</Text>

            <View style={styles.avatarGrid}>
              {AVATARS.map((av) => (
                <Pressable
                  key={av.id}
                  style={[
                    styles.avatarItem,
                    selectedAvatar === av.id && styles.avatarItemActive,
                  ]}
                  onPress={() => { setSelectedAvatar(av.id); setCustomAvatar(null); }}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: av.color, borderColor: selectedAvatar === av.id ? colors.accent : "transparent" }]}>
                    <Ionicons
                      name={av.gender === "male" ? "person" : "person"}
                      size={28}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.avatarLabel}>{av.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Upload options */}
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={22} color={colors.accent} />
                <Text style={styles.uploadText}>Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Ionicons name="images-outline" size={22} color={colors.accent} />
                <Text style={styles.uploadText}>Choose from gallery</Text>
              </TouchableOpacity>
            </View>

            {customAvatar && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: customAvatar }} style={styles.previewImage} />
                <TouchableOpacity style={styles.previewRemove} onPress={() => setCustomAvatar(null)}>
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
              onPress={handleStep2Next}
              disabled={saving}
            >
              <Text style={styles.nextBtnText}>{saving ? "Saving..." : "Continue"}</Text>
              {!saving && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => { setSelectedAvatar("m1"); handleStep2Next(); }}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Welcome */}
        {step === 3 && (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeCircle}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
            <Text style={styles.welcomeTitle}>Welcome, {name.split(" ")[0]}!</Text>
            <Text style={styles.welcomeSubtitle}>
              Your profile is all set.{"\n"}Let's explore Sakleshpura!
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={handleFinish}>
              <Text style={styles.startBtnText}>Start Exploring</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
  },
  progressDotActive: { backgroundColor: colors.accent },
  progressDotCurrent: { width: 56 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 28,
  },
  field: { marginBottom: 20 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: "#fff",
    fontSize: 15,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  genderBtnActive: {
    backgroundColor: "rgba(30,107,255,0.15)",
    borderColor: colors.accent,
  },
  genderText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  genderTextActive: {
    color: colors.accent,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  avatarItem: {
    width: AVATAR_SIZE,
    alignItems: "center",
    gap: 6,
  },
  avatarItemActive: {
    opacity: 1,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  avatarLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  uploadRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  previewRemove: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  nextBtn: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  welcomeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  startBtn: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
