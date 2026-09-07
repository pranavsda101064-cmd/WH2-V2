import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Easing,
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

import { colors, radius } from "@/src/theme";
import { api, getProfileCompleted } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";

const BG =
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1400&q=80";

type Role = "customer" | "driver";

/* ── Google Sign-In (separate component to isolate hook) ── */
import * as Google from "expo-auth-session/providers/google";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

function GoogleSignInButton({
  disabled,
  onSuccess,
  onError,
}: {
  disabled: boolean;
  onSuccess: (accessToken: string) => void;
  onError: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    selectAccount: true,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const accessToken = response.authentication?.accessToken;
      if (!accessToken) {
        onError("No access token received from Google");
        return;
      }
      setLoading(true);
      onSuccess(accessToken);
    } else if (response.type === "error") {
      onError("Google sign-in failed: " + (response.error?.description || "unknown error"));
    }
  }, [response]);

  return (
    <SpringPress
      style={[styles.googleBtn, (loading || !request || disabled) && styles.ctaDisabled]}
      onPress={() => request && promptAsync()}
      disabled={disabled || loading || !request}
      testID="google-sign-in-button"
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.googleText}>Continue with Google</Text>
        </>
      )}
    </SpringPress>
  );
}

/* ── Shake Error ── */
function ShakeError({ message }: { message: string }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [message]);

  return (
    <Animated.Text style={[styles.error, { transform: [{ translateX: shakeAnim }] }]}>
      {message}
    </Animated.Text>
  );
}

/* ── Main Auth Screen ── */
export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role: Role = "customer";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const emailBorder = useRef(new Animated.Value(0)).current;
  const passwordBorder = useRef(new Animated.Value(0)).current;

  const animateBorder = (anim: Animated.Value, to: number) => {
    Animated.timing(anim, { toValue: to, duration: 200, useNativeDriver: false }).start();
  };

  const handleGoogleSuccess = (accessToken: string) => {
    api.googleAuth(accessToken, role)
      .then(async () => {
        const completed = await getProfileCompleted();
        router.replace(completed ? "/(tabs)/home" : "/profile-setup");
      })
      .catch(() => setError("Google sign-in failed"));
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
      const completed = await getProfileCompleted();
      router.replace(completed ? "/(tabs)/home" : "/profile-setup");
    } catch {
      try {
        await api.register(email.trim(), password, role);
        router.replace("/profile-setup");
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
        <SpringPress
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="auth-back-button"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </SpringPress>
        <Text style={styles.h1}>Welcome</Text>
        <Text style={styles.hSub}>Sign in to continue your journey</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetWrap}
      >
        <BlurView intensity={40} tint="dark" style={styles.sheet}>
          <View style={styles.grabber} />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <Animated.View style={[styles.input, { borderColor: emailBorder.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accent] }) }]}>
            <Ionicons name="mail-outline" size={18} color={focusedField === "email" ? colors.accent : colors.textDim} style={{ marginRight: 10 }} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              placeholderTextColor={colors.textDim}
              style={styles.inputText}
              testID="email-input"
              onFocus={() => { setFocusedField("email"); animateBorder(emailBorder, 1); }}
              onBlur={() => { setFocusedField(null); animateBorder(emailBorder, 0); }}
            />
          </Animated.View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <Animated.View style={[styles.input, { borderColor: passwordBorder.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.accent] }) }]}>
            <Ionicons name="lock-closed-outline" size={18} color={focusedField === "password" ? colors.accent : colors.textDim} style={{ marginRight: 10 }} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textDim}
              style={[styles.inputText, { flex: 1 }]}
              testID="password-input"
              onFocus={() => { setFocusedField("password"); animateBorder(passwordBorder, 1); }}
              onBlur={() => { setFocusedField(null); animateBorder(passwordBorder, 0); }}
            />
            <SpringPress onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textDim}
              />
            </SpringPress>
          </Animated.View>

          {error ? <ShakeError message={error} /> : null}

          <SpringPress
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={onContinue}
            disabled={loading}
            testID="auth-continue-button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Sign in</Text>
            )}
          </SpringPress>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In — only on web/iOS where androidClientId isn't needed */}
          {Platform.OS !== "android" && (
            <GoogleSignInButton
              disabled={loading}
              onSuccess={handleGoogleSuccess}
              onError={setError}
            />
          )}

          <Text style={[styles.legal, { marginBottom: insets.bottom + 12 }]}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 24, paddingBottom: 32 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  h1: { color: "#fff", fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  hSub: { color: colors.textMuted, fontSize: 16, marginTop: 6 },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24,
    paddingTop: 10, paddingBottom: 12, overflow: "hidden",
    backgroundColor: "rgba(15,16,18,0.85)", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  grabber: {
    alignSelf: "center", width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 18,
  },
  label: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 10 },
  input: {
    flexDirection: "row", alignItems: "center", height: 56, borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, paddingHorizontal: 16, marginBottom: 20,
  },
  inputText: { flex: 1, color: "#fff", fontSize: 16 },
  error: {
    color: colors.danger, fontSize: 13, marginBottom: 10, marginTop: -12,
  },
  cta: {
    backgroundColor: colors.accent, height: 56, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center", marginTop: 4,
    shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  dividerText: { color: colors.textDim, fontSize: 13, marginHorizontal: 14 },
  googleBtn: {
    backgroundColor: "rgba(255,255,255,0.12)", height: 56, borderRadius: radius.md,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  googleText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  legal: { color: colors.textDim, fontSize: 12, textAlign: "center", marginTop: 14 },
});
