import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

import { colors, radius } from "@/src/theme";
import { api, getProfileCompleted } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  scopes: ["profile", "email"],
  offlineAccess: false,
});

const BG =
  "https://images.unsplash.com/photo-DY4ZEkiPPPA?auto=format&fit=crop&w=1400&q=80";

function ShakeError({ text }: { text: string }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!text) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [text]);

  if (!text) return null;
  return (
    <Animated.Text style={[styles.error, { transform: [{ translateX: shakeAnim }] }]}>
      {text}
    </Animated.Text>
  );
}

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type !== "success") return;
      const idToken = response.data.idToken;
      if (!idToken) {
        setError("No ID token received from Google");
        return;
      }
      setGoogleLoading(true);
      await api.googleAuth(idToken, "driver");
      const completed = await getProfileCompleted();
      router.replace(completed ? "/(tabs)" : "/driver-onboarding");
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return;
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onContinue = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.login(email.trim(), password);
      router.replace("/(tabs)");
    } catch {
      try {
        await api.register(email.trim(), password, "driver");
        router.replace("/driver-onboarding");
      } catch {
        setError("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root} testID="auth-screen">
      <StatusBar style="light" />
      <ImageBackground source={{ uri: BG }} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.85)", "#000"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <SpringPress style={styles.backBtn} onPress={() => router.back()} testID="auth-back-button">
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </SpringPress>
        <FadeIn delay={200}>
          <Text style={styles.h1}>Welcome</Text>
        </FadeIn>
        <FadeIn delay={300}>
          <Text style={styles.hSub}>Sign in to continue your journey</Text>
        </FadeIn>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetWrap}
      >
        <BlurView intensity={40} tint="dark" style={styles.sheet}>
          <View style={styles.grabber} />

          {/* Email */}
          <FadeIn delay={400}>
            <Text style={styles.label}>Email</Text>
          </FadeIn>
          <FadeIn delay={450}>
            <View style={styles.input}>
              <Ionicons name="mail-outline" size={18} color={colors.textDim} style={{ marginRight: 10 }} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor={colors.textDim}
                style={styles.inputText}
                testID="email-input"
              />
            </View>
          </FadeIn>

          {/* Password */}
          <FadeIn delay={500}>
            <Text style={styles.label}>Password</Text>
          </FadeIn>
          <FadeIn delay={550}>
            <View style={styles.input}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textDim} style={{ marginRight: 10 }} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Min 6 characters"
                placeholderTextColor={colors.textDim}
                style={styles.inputText}
                testID="password-input"
              />
            </View>
          </FadeIn>

          <ShakeError text={error} />

          <FadeIn delay={600}>
            <SpringPress
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={onContinue}
              testID="auth-continue-button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Sign in</Text>
              )}
            </SpringPress>
          </FadeIn>

          {/* Divider */}
          <FadeIn delay={650}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          </FadeIn>

          {/* Google Sign In */}
          <FadeIn delay={700}>
            <SpringPress
              style={[styles.googleBtn, (googleLoading || loading) && styles.ctaDisabled]}
              onPress={handleGoogleLogin}
              testID="google-sign-in-button"
            >
              {googleLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </SpringPress>
          </FadeIn>

          <FadeIn delay={750}>
            <Text style={[styles.legal, { marginBottom: insets.bottom + 12 }]}>
              By continuing you agree to our Terms & Privacy Policy.
            </Text>
          </FadeIn>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 24, paddingBottom: 32 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  h1: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  hSub: { color: colors.textMuted, fontSize: 16, marginTop: 6 },
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    overflow: "hidden",
    backgroundColor: "rgba(15,16,18,0.85)",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 18,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputText: { flex: 1, color: "#fff", fontSize: 16 },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 10,
    marginTop: -12,
  },
  cta: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dividerText: {
    color: colors.textDim,
    fontSize: 13,
    marginHorizontal: 14,
  },
  googleBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    height: 56,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  googleText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  legal: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
  },
});
