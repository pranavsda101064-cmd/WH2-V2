import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Animated,
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
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { api, getProfileCompleted } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ["profile", "email"],
  offlineAccess: false,
});

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const emailBorder = useRef(new Animated.Value(0)).current;
  const passwordBorder = useRef(new Animated.Value(0)).current;

  const animateBorder = (anim: Animated.Value, to: number) => {
    Animated.timing(anim, { toValue: to, duration: 200, useNativeDriver: false }).start();
  };

  const handleGoogleSuccess = (idToken: string) => {
    api.googleAuth(idToken, "customer")
      .then(async () => {
        const completed = await getProfileCompleted();
        router.replace(completed ? "/(tabs)/home" : "/profile-setup");
      })
      .catch(() => setError("Google sign-in failed"));
  };

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
      handleGoogleSuccess(idToken);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      setError(error.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
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
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
        >
          {/* Back button */}
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <SpringPress style={styles.backBtn} onPress={() => router.back()} testID="auth-back-button">
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </SpringPress>
          </View>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.h1}>Sign in</Text>
            <Text style={styles.hSub}>Enter your credentials to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <Animated.View
              style={[
                styles.input,
                {
                  borderColor: emailBorder.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.border, colors.accent],
                  }),
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={focusedField === "email" ? colors.accent : colors.textDim}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor={colors.textDim}
                style={styles.inputText}
                testID="email-input"
                onFocus={() => {
                  setFocusedField("email");
                  animateBorder(emailBorder, 1);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateBorder(emailBorder, 0);
                }}
              />
            </Animated.View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <Animated.View
              style={[
                styles.input,
                {
                  borderColor: passwordBorder.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.border, colors.accent],
                  }),
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={focusedField === "password" ? colors.accent : colors.textDim}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Min 6 characters"
                placeholderTextColor={colors.textDim}
                style={[styles.inputText, { flex: 1 }]}
                testID="password-input"
                onFocus={() => {
                  setFocusedField("password");
                  animateBorder(passwordBorder, 1);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  animateBorder(passwordBorder, 0);
                }}
              />
              <SpringPress onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textDim}
                />
              </SpringPress>
            </Animated.View>

            {/* Forgot password */}
            <Text
              style={styles.forgotText}
              onPress={() => {
                Alert.alert(
                  "Reset Password",
                  "Please contact support to reset your password.",
                  [
                    { text: "OK" },
                    {
                      text: "Email us",
                      onPress: () => Linking.openURL("mailto:support@where2.app"),
                    },
                  ],
                );
              }}
            >
              Forgot password?
            </Text>

            <ShakeError message={error} />

            {/* Sign in — solid accent button */}
            <SpringPress
              style={[styles.cta, loading && styles.disabled]}
              onPress={handleLogin}
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

            {/* Create account */}
            <SpringPress style={styles.outlineBtn} onPress={handleRegister}>
              <Text style={styles.outlineBtnText}>Create account</Text>
            </SpringPress>

            {/* Google Sign In */}
            <SpringPress
              style={[styles.googleBtn, (googleLoading || loading) && styles.disabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || loading}
              testID="google-sign-in-button"
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.text} />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </SpringPress>
          </View>

          {/* Legal */}
          <Text style={[styles.legal, { paddingBottom: insets.bottom + spacing.md }]}>
            By continuing you agree to our{" "}
            <Text style={styles.legal} onPress={() => router.push("/terms")}>
              Terms
            </Text>
            {" & "}
            <Text style={styles.legal} onPress={() => router.push("/privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>
        </KeyboardAvoidingView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Title
  titleBlock: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  h1: {
    fontSize: font.h2,
    fontWeight: "600",
    color: colors.text,
  },
  hSub: {
    fontSize: font.body,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Form
  form: {
    flex: 1,
  },
  label: {
    fontSize: font.label,
    fontWeight: "500",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inputText: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
  },
  forgotText: {
    fontSize: font.small,
    fontWeight: "500",
    color: colors.accent,
    textAlign: "right",
    marginBottom: spacing.md,
  },
  error: {
    fontSize: font.small,
    color: colors.danger,
    marginBottom: spacing.sm,
    marginTop: -spacing.sm,
  },

  // CTA — solid accent pill
  cta: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.accent,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  disabled: {
    opacity: 0.5,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: font.caption,
    color: colors.textDim,
    marginHorizontal: spacing.md,
  },

  // Outline button
  outlineBtn: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  // Google button
  googleBtn: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  googleText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },

  // Legal
  legal: {
    fontSize: font.caption,
    fontWeight: "400",
    color: colors.textDim,
    textAlign: "center",
    lineHeight: 18,
  },
});
