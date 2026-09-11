import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { api, getProfileCompleted, setProfileCompleted, setUserName } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";

const { width: SCREEN_W } = Dimensions.get("window");
const AVATAR_SIZE = Math.round((SCREEN_W - 80) / 3);

const DICEBEAR_BASE = "https://api.dicebear.com/10.x";

const MALE_AVATARS = [
  { id: "m1", seed: "kai" },
  { id: "m2", seed: "ronan" },
  { id: "m3", seed: "avi" },
  { id: "m4", seed: "zane" },
  { id: "m5", seed: "leo" },
  { id: "m6", seed: "omar" },
];

const FEMALE_AVATARS = [
  { id: "f1", seed: "lily" },
  { id: "f2", seed: "mira" },
  { id: "f3", seed: "zara" },
  { id: "f4", seed: "priya" },
  { id: "f5", seed: "suki" },
  { id: "f6", seed: "nina" },
];

const OTHER_AVATARS = [
  { id: "o1", seed: "sky" },
  { id: "o2", seed: "river" },
  { id: "o3", seed: "sage" },
  { id: "o4", seed: "quinn" },
  { id: "o5", seed: "fern" },
  { id: "o6", seed: "nova" },
];

function getAvatarUrl(seed: string, gender: "male" | "female" | "other"): string {
  const style = gender === "female" ? "lorelei" : gender === "male" ? "adventurer" : "adventurer-neutral";
  return `${DICEBEAR_BASE}/${style}/png?seed=${seed}&size=128&backgroundColor=transparent`;
}

function getAvatarsForGender(gender: string) {
  switch (gender) {
    case "male": return MALE_AVATARS;
    case "female": return FEMALE_AVATARS;
    case "other": return OTHER_AVATARS;
    default: return OTHER_AVATARS;
  }
}

function getGenderStyle(gender: string): "male" | "female" | "other" {
  if (gender === "male" || gender === "female") return gender;
  return "other";
}

type Step = 1 | 2 | 3;

function AnimatedAvatar({
  seed,
  gender,
  selected,
  onPress,
}: {
  seed: string;
  gender: "male" | "female" | "other";
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, friction: 4, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      style={[styles.avatarItem, selected && styles.avatarItemActive]}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.avatarCircle,
          {
            borderColor: selected ? colors.accent : "transparent",
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={{ uri: getAvatarUrl(seed, gender) }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </Animated.View>
    </Pressable>
  );
}

export default function ProfileSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateStep = (toStep: Step) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -SCREEN_W, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(SCREEN_W);
      setStep(toStep);
      setError("");
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    getProfileCompleted().then((completed) => {
      if (completed) setEditMode(true);
    });
    api.getProfile().then((p) => {
      if (p) {
        if (p.full_name) setName(p.full_name);
        if (p.phone) setPhone(p.phone.replace("+91", "").trim());
        if (p.gender) setGender(p.gender);
        if (p.avatar_url) {
          if (p.avatar_url.startsWith("/avatars/")) {
            const file = p.avatar_url.split("/").pop() || "m1.png";
            const id = file.replace(/\.(png|jpg|jpeg|webp)$/i, "");
            setSelectedAvatar(id);
          } else {
            setCustomAvatar(p.avatar_url);
          }
        }
      }
    }).catch(() => {});
  }, []);

  const pickImage = async () => {
    try {
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
    } catch {
      setError("Could not access photo library");
    }
  };

  const takePhoto = async () => {
    try {
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
    } catch {
      setError("Could not access camera");
    }
  };

  // Name: only letters, spaces, hyphens, apostrophes
  const sanitizeName = (text: string) => {
    return text.replace(/[^a-zA-Z\s\-']/g, "");
  };

  // Phone: only digits
  const sanitizePhone = (text: string) => {
    return text.replace(/[^0-9]/g, "").slice(0, 10);
  };

  const handleStep1Next = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      setError("Name can only contain letters");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setError("");

    if (editMode) {
      setSaving(true);
      try {
        let avatarUrl: string | undefined;
        if (customAvatar) avatarUrl = customAvatar;
        else if (selectedAvatar) avatarUrl = `/avatars/${selectedAvatar}.png`;
        await api.updateProfile({
          full_name: trimmedName,
          phone: `+91${phone.trim()}`,
          gender: gender || undefined,
          avatar_url: avatarUrl,
        });
        await setUserName(trimmedName);
        router.back();
      } catch {
        setError("Failed to save profile. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      animateStep(2);
    }
  };

  const handleStep2Next = async () => {
    setSaving(true);
    setError("");
    try {
      let avatarUrl: string | undefined;

      if (customAvatar && customAvatar.startsWith("file://")) {
        const ext = customAvatar.split(".").pop()?.toLowerCase() || "jpg";
        const uploadResult = await api.uploadAvatar({
          uri: customAvatar,
          type: "image/jpeg",
          name: `avatar.${ext}`,
        });
        avatarUrl = uploadResult.avatar_url;
      } else if (customAvatar) {
        avatarUrl = customAvatar;
      } else if (selectedAvatar) {
        avatarUrl = `/avatars/${selectedAvatar}.png`;
      }

      await api.updateProfile({
        full_name: name.trim(),
        phone: `+91${phone.trim()}`,
        gender: gender || undefined,
        avatar_url: avatarUrl,
      });

      await setUserName(name.trim());
      await setProfileCompleted(true);

      animateStep(3);
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    router.replace("/(tabs)/home");
  };

  const availableAvatars = getAvatarsForGender(gender);
  const avatarGenderStyle = getGenderStyle(gender);

  return (
    <Pressable style={styles.root} testID="profile-setup-screen" onPress={() => Keyboard.dismiss()}>
      <StatusBar style="dark" />

      {editMode && (
        <SpringPress
          style={[styles.backHeader, { paddingTop: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backHeaderText}>Edit Profile</Text>
        </SpringPress>
      )}

      {!editMode && (
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
      )}

      <Animated.View style={{
        flex: 1,
        transform: [{ translateX: slideAnim }],
        opacity: fadeAnim,
      }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <>
              <Text style={styles.title}>{editMode ? "Edit your details" : "Tell us about yourself"}</Text>
              <Text style={styles.subtitle}>We'll use this to personalize your experience</Text>

              {/* Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Full name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(t) => setName(sanitizeName(t))}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="words"
                  maxLength={50}
                  testID="name-input"
                />
              </View>

              {/* Phone with +91 prefix */}
              <View style={styles.field}>
                <Text style={styles.label}>Phone number *</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+91</Text>
                  </View>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={(t) => setPhone(sanitizePhone(t))}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textDim}
                    keyboardType="phone-pad"
                    maxLength={10}
                    testID="phone-input"
                  />
                </View>
              </View>

              {/* Gender */}
              <View style={styles.field}>
                <Text style={styles.label}>Gender (optional)</Text>
                <View style={styles.genderRow}>
                  {(["male", "female", "other"] as const).map((g) => (
                    <SpringPress
                      key={g}
                      style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                      onPress={() => {
                        setGender(g === gender ? "" : g);
                        setSelectedAvatar(null);
                        setCustomAvatar(null);
                      }}
                    >
                      <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                        {g === "male" ? "Male" : g === "female" ? "Female" : "Other"}
                      </Text>
                    </SpringPress>
                  ))}
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <SpringPress style={styles.ctaBtn} onPress={handleStep1Next}>
                <Text style={styles.ctaBtnText}>{editMode ? "Save" : "Next"}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </SpringPress>
            </>
          )}

          {/* Step 2: Avatar */}
          {step === 2 && (
            <>
              <Text style={styles.title}>Choose your avatar</Text>
              <Text style={styles.subtitle}>
                {gender ? `Pick a ${gender === "male" ? "male" : gender === "female" ? "female" : "neutral"} avatar or upload your own` : "Pick an avatar or upload your own"}
              </Text>

              <View style={styles.avatarGrid}>
                {availableAvatars.map((av) => (
                  <AnimatedAvatar
                    key={av.id}
                    seed={av.seed}
                    gender={avatarGenderStyle}
                    selected={selectedAvatar === av.id}
                    onPress={() => { setSelectedAvatar(av.id); setCustomAvatar(null); }}
                  />
                ))}
              </View>

              <View style={styles.uploadRow}>
                <SpringPress style={styles.uploadBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={20} color={colors.accent} />
                  <Text style={styles.uploadText}>Take photo</Text>
                </SpringPress>
                <SpringPress style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="images-outline" size={20} color={colors.accent} />
                  <Text style={styles.uploadText}>Gallery</Text>
                </SpringPress>
              </View>

              {customAvatar && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: customAvatar }} style={styles.previewImage} />
                  <SpringPress style={styles.previewRemove} onPress={() => setCustomAvatar(null)}>
                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                  </SpringPress>
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <SpringPress
                style={[styles.ctaBtn, saving && styles.ctaBtnDisabled]}
                onPress={handleStep2Next}
                disabled={saving}
              >
                <Text style={styles.ctaBtnText}>{saving ? "Saving..." : editMode ? "Save" : "Continue"}</Text>
                {!saving && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </SpringPress>

              {!editMode && (
                <SpringPress style={styles.skipBtn} onPress={() => { setSelectedAvatar(availableAvatars[0].id); handleStep2Next(); }}>
                  <Text style={styles.skipText}>Skip for now</Text>
                </SpringPress>
              )}
            </>
          )}

          {/* Step 3: Welcome */}
          {step === 3 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeCircle}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </View>
              <Text style={styles.welcomeTitle}>Welcome, {name.split(" ")[0]}!</Text>
              <Text style={styles.welcomeSubtitle}>
                Your profile is all set.{"\n"}Let's explore Sakleshpura!
              </Text>
              <SpringPress style={styles.ctaBtn} onPress={handleFinish}>
                <Text style={styles.ctaBtnText}>Start Exploring</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </SpringPress>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  backHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: spacing.lg, paddingBottom: 12,
  },
  backHeaderText: { color: colors.text, fontSize: 17, fontWeight: "600" },
  progressContainer: {
    flexDirection: "row", justifyContent: "center", gap: 8,
    paddingBottom: 12, paddingHorizontal: spacing.md,
  },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt },
  progressDotActive: { backgroundColor: colors.accent },
  progressDotCurrent: { width: 56 },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: 40 },

  // Title
  title: {
    fontSize: font.title, fontWeight: "600", color: colors.text,
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: font.body, fontWeight: "400", color: colors.textMuted,
    marginBottom: spacing.xl,
  },

  // Fields
  field: { marginBottom: spacing.lg },
  label: {
    fontSize: font.label, fontWeight: "500", color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    height: 52, borderRadius: radius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md,
    color: colors.text, fontSize: font.body,
  },

  // Phone with +91
  phoneRow: {
    flexDirection: "row", alignItems: "center", height: 52,
    borderRadius: radius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  phonePrefix: {
    backgroundColor: colors.surfaceAlt, height: "100%", paddingHorizontal: spacing.md,
    justifyContent: "center", minWidth: 60,
  },
  phonePrefixText: {
    fontSize: font.body, fontWeight: "600", color: colors.text,
  },
  phoneDivider: {
    width: 1, height: "60%", backgroundColor: colors.border,
  },
  phoneInput: {
    flex: 1, height: "100%", paddingHorizontal: spacing.md,
    color: colors.text, fontSize: font.body,
  },

  // Gender
  genderRow: { flexDirection: "row", gap: spacing.sm },
  genderBtn: {
    flex: 1, height: 48, borderRadius: radius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  genderBtnActive: { backgroundColor: "rgba(0,137,123,0.15)", borderColor: colors.accent },
  genderText: { fontSize: font.label, fontWeight: "500", color: colors.textMuted },
  genderTextActive: { color: colors.accent },

  // Avatar grid — 3 columns
  avatarGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: spacing.md,
    marginBottom: spacing.lg, justifyContent: "center",
  },
  avatarItem: { width: AVATAR_SIZE, alignItems: "center" },
  avatarItemActive: { opacity: 1 },
  avatarCircle: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3, borderColor: "transparent", overflow: "hidden",
  },
  avatarImage: {
    width: "100%", height: "100%",
  },

  // Upload
  uploadRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  uploadBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, height: 48, borderRadius: radius.sm, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  uploadText: { fontSize: font.small, fontWeight: "500", color: colors.text },
  previewContainer: { alignItems: "center", marginBottom: spacing.md },
  previewImage: { width: 100, height: 100, borderRadius: 50 },
  previewRemove: { position: "absolute", top: -4, right: -4 },

  // Error
  error: { fontSize: font.small, color: colors.danger, marginBottom: spacing.md },

  // CTA — consistent pill with Screens 1 & 2
  ctaBtn: {
    height: 52, borderRadius: radius.pill, backgroundColor: colors.accent,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, marginTop: spacing.sm, ...shadows.accent,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  // Skip
  skipBtn: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.xs },
  skipText: { fontSize: font.label, color: colors.textMuted },

  // Welcome
  welcomeContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  welcomeCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
    ...shadows.accent,
  },
  welcomeTitle: {
    fontSize: font.title, fontWeight: "600", color: colors.text,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: font.body, color: colors.textMuted, textAlign: "center",
    lineHeight: 22, marginBottom: spacing.xxl,
  },
});
