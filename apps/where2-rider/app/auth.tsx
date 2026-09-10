import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { api, getProfileCompleted } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

const BG =
  "https://images.unsplash.com/photo-DY4ZEkiPPPA?auto=format&fit=crop&w=1400&q=80";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";

/* ── Google Sign-In (separate component to isolate hook) ── */
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
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
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
    if (!message) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [message]);

  if (!message) return null;
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
    api.googleAuth(accessToken, "customer")
      .then(async () => {
        const completed = await getProfileCompleted();
        router.replace(completed ? "/(tabs)/home" : "/profile-setup");
      })
      .catch(() => setError("Google sign-in failed"));
  };

  const validate = (): boolean => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!password.trim()) {
      setError("Password is required");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setError("");
    setLoading(true);
    try {
      await api.login(email.trim(), password);
      const completed = await getProfileCompleted();
      router.replace(completed ? "/(tabs)/home" : "/profile-setup");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.register(email.trim(), password, "customer");
      router.replace("/profile-setup");
    } catch {
      setError("Could not create account. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={() => Keyboard.dismiss()}>
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
          <FadeIn delay={100}>
            <Text style={styles.h1}>Welcome</Text>
          </FadeIn>
          <FadeIn delay={200}>
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
            <FadeIn delay={250}>
              <Text style={styles.label}>Email</Text>
            </FadeIn>
            <FadeIn delay={300}>
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
            </FadeIn>

            {/* Password */}
            <FadeIn delay={350}>
              <Text style={styles.label}>Password</Text>
            </FadeIn>
            <FadeIn delay={400}>
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
            </FadeIn>

            {/* Forgot password */}
            <FadeIn delay={430}>
              <Text
                style={styles.forgotText}
                onPress={() => {
                  Alert.alert(
                    "Reset Password",
                    "Please contact support to reset your password.",
                    [
                      { text: "OK" },
                      { text: "Email us", onPress: () => Linking.openURL("mailto:support@where2.app") },
                    ],
                  );
                }}
              >
                Forgot password?
              </Text>
            </FadeIn>

            <ShakeError message={error} />

            {/* Sign in — glossy gradient */}
            <FadeIn delay={450}>
              <LinearGradient
                colors={[colors.accent, colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <SpringPress
                  style={[styles.cta, loading && styles.ctaDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  testID="auth-continue-button"
                >
                  <View style={styles.ctaShine} pointerEvents="none" />
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ctaText}>Sign in</Text>
                  )}
                </SpringPress>
              </LinearGradient>
            </FadeIn>

            {/* Divider */}
            <FadeIn delay={500}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            </FadeIn>

            {/* Create account */}
            <FadeIn delay={550}>
              <SpringPress style={styles.createBtn} onPress={handleRegister}>
                <Text style={styles.createBtnText}>Create account</Text>
              </SpringPress>
            </FadeIn>

            {/* Google Sign In — works on all platforms via webClientId fallback */}
            <FadeIn delay={600}>
              <GoogleSignInButton
                disabled={loading}
                onSuccess={handleGoogleSuccess}
                onError={setError}
              />
            </FadeIn>

            {/* Tappable legal */}
            <FadeIn delay={650}>
              <Text style={[styles.legal, { marginBottom: insets.bottom + 12 }]}>
                By continuing you agree to our{" "}
                <Text style={styles.legalLink} onPress={() => router.push("/terms")}>
                  Terms
                </Text>
                {" & "}
                <Text style={styles.legalLink} onPress={() => router.push("/privacy")}>
                  Privacy Policy
                </Text>.
              </Text>
            </FadeIn>
          </BlurView>
        </KeyboardAvoidingView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  h1: { color: "#fff", fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  hSub: { color: colors.textMuted, fontSize: font.subtitle, marginTop: 6 },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: spacing.lg,
    paddingTop: 10, paddingBottom: 12, overflow: "hidden",
    backgroundColor: "rgba(15,16,18,0.85)", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  grabber: {
    alignSelf: "center", width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 18,
  },
  label: { color: "#fff", fontSize: font.label, fontWeight: "600", marginBottom: 10 },
  input: {
    flexDirection: "row", alignItems: "center", height: 56, borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, paddingHorizontal: spacing.md, marginBottom: 20,
  },
  inputText: { flex: 1, color: "#fff", fontSize: font.subtitle },
  forgotText: {
    color: colors.accent, fontSize: font.small, fontWeight: "600",
    textAlign: "right", marginBottom: spacing.md,
  },
  error: {
    color: colors.danger, fontSize: font.small, marginBottom: 10, marginTop: -12,
  },
  ctaGradient: {
    borderRadius: radius.md, marginBottom: 4,
    ...shadows.accent,
  },
  cta: {
    height: 56, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  ctaShine: {
    position: "absolute", top: 0, left: 0, right: 0, height: "50%",
    borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.12)",
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: font.subtitle, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  dividerText: { color: colors.textDim, fontSize: font.small, marginHorizontal: 14 },
  createBtn: {
    height: 52, borderRadius: radius.md, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  createBtnText: { color: "#fff", fontSize: font.body, fontWeight: "600" },
  googleBtn: {
    backgroundColor: "rgba(255,255,255,0.12)", height: 56, borderRadius: radius.md,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  googleText: { color: "#fff", fontSize: font.subtitle, fontWeight: "600" },
  legal: { color: colors.textDim, fontSize: font.caption, textAlign: "center", marginTop: 14 },
  legalLink: { color: colors.accent, fontWeight: "600" },
});
