import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
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

import { colors, radius } from "@/src/theme";
import { api, getProfileCompleted, setProfileCompleted, setUserName } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";

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

function AnimatedAvatar({ av, selected, onPress }: {
  av: typeof AVATARS[0]; selected: boolean; onPress: () => void;
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
          { backgroundColor: av.color, borderColor: selected ? colors.accent : "transparent", transform: [{ scale }] },
        ]}
      >
        <Ionicons name="person" size={28} color="#fff" />
      </Animated.View>
      <Text style={styles.avatarLabel}>{av.label}</Text>
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
  const [address, setAddress] = useState("");
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
        if (p.phone) setPhone(p.phone);
        if (p.gender) setGender(p.gender);
        if (p.address) setAddress(p.address);
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

  const handleStep1Next = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError("Please enter a valid phone number");
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
          full_name: name.trim(),
          phone: phone.trim(),
          gender: gender || undefined,
          avatar_url: avatarUrl,
          address: address.trim() || undefined,
        });
        await setUserName(name.trim());
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
        phone: phone.trim(),
        gender: gender || undefined,
        avatar_url: avatarUrl,
        address: address.trim() || undefined,
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

  return (
    <View style={styles.root} testID="profile-setup-screen">
      <StatusBar style="light" />

      {editMode && (
        <SpringPress
          style={[styles.backHeader, { paddingTop: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
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
                    <SpringPress
                      key={g}
                      style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                      onPress={() => setGender(g === gender ? "" : g)}
                    >
                      <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                        {g === "male" ? "Male" : g === "female" ? "Female" : "Other"}
                      </Text>
                    </SpringPress>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Address (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="words"
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <SpringPress style={styles.nextBtn} onPress={handleStep1Next}>
                <Text style={styles.nextBtnText}>{editMode ? "Save" : "Next"}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </SpringPress>
            </>
          )}

          {/* Step 2: Avatar */}
          {step === 2 && (
            <>
              <Text style={styles.title}>Choose your avatar</Text>
              <Text style={styles.subtitle}>Pick an avatar or upload your own photo</Text>

              <View style={styles.avatarGrid}>
                {AVATARS.map((av) => (
                  <AnimatedAvatar
                    key={av.id}
                    av={av}
                    selected={selectedAvatar === av.id}
                    onPress={() => { setSelectedAvatar(av.id); setCustomAvatar(null); }}
                  />
                ))}
              </View>

              <View style={styles.uploadRow}>
                <SpringPress style={styles.uploadBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={22} color={colors.accent} />
                  <Text style={styles.uploadText}>Take photo</Text>
                </SpringPress>
                <SpringPress style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="images-outline" size={22} color={colors.accent} />
                  <Text style={styles.uploadText}>Choose from gallery</Text>
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
                style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
                onPress={handleStep2Next}
                disabled={saving}
              >
                <Text style={styles.nextBtnText}>{saving ? "Saving..." : editMode ? "Save" : "Continue"}</Text>
                {!saving && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </SpringPress>

              {!editMode && (
                <SpringPress style={styles.skipBtn} onPress={() => { setSelectedAvatar("m1"); handleStep2Next(); }}>
                  <Text style={styles.skipText}>Skip for now</Text>
                </SpringPress>
              )}
            </>
          )}

          {/* Step 3: Welcome (only for first-time setup) */}
          {step === 3 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeCircle}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </View>
              <Text style={styles.welcomeTitle}>Welcome, {name.split(" ")[0]}!</Text>
              <Text style={styles.welcomeSubtitle}>
                Your profile is all set.{"\n"}Let's explore Sakleshpura!
              </Text>
              <SpringPress style={styles.startBtn} onPress={handleFinish}>
                <Text style={styles.startBtnText}>Start Exploring</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </SpringPress>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  backHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backHeaderText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  progressContainer: {
    flexDirection: "row", justifyContent: "center", gap: 8,
    paddingBottom: 12, paddingHorizontal: 16,
  },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt },
  progressDotActive: { backgroundColor: colors.accent },
  progressDotCurrent: { width: 56 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  title: {
    color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginTop: 8,
  },
  subtitle: {
    color: colors.textMuted, fontSize: 14, marginTop: 6, marginBottom: 28,
  },
  field: { marginBottom: 20 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: {
    height: 52, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
    color: "#fff", fontSize: 15,
  },
  genderRow: { flexDirection: "row", gap: 10 },
  genderBtn: {
    flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  genderBtnActive: { backgroundColor: "rgba(30,107,255,0.15)", borderColor: colors.accent },
  genderText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  genderTextActive: { color: colors.accent },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  avatarItem: { width: AVATAR_SIZE, alignItems: "center", gap: 6 },
  avatarItemActive: { opacity: 1 },
  avatarCircle: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "transparent",
  },
  avatarLabel: { color: colors.textMuted, fontSize: 11 },
  uploadRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  uploadBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  uploadText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  previewContainer: { alignItems: "center", marginBottom: 16 },
  previewImage: { width: 100, height: 100, borderRadius: 50 },
  previewRemove: { position: "absolute", top: -4, right: -4 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  nextBtn: {
    height: 56, borderRadius: radius.md, backgroundColor: colors.accent,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 8,
    shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  skipBtn: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  skipText: { color: colors.textMuted, fontSize: 14 },
  welcomeContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  welcomeCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
    shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 0 },
  },
  welcomeTitle: {
    color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 12,
  },
  welcomeSubtitle: {
    color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 40,
  },
  startBtn: {
    height: 56, borderRadius: radius.md, backgroundColor: colors.accent,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, width: "100%",
    shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  startBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
