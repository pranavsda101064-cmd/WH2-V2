import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";

import { colors, radius } from "@/src/theme";
import { api } from "@/src/api";

const BG =
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1400&q=80";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_REDIRECT_URI = "https://auth.expo.io/@prannare/frontend";

const googleDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

type Role = "customer" | "driver";

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState("");

  useEffect(() => {
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, Math.random().toString()).then(setNonce);
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: nonce ? { nonce } : undefined,
    },
    googleDiscovery,
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setError("No ID token received from Google");
        return;
      }
      setGoogleLoading(true);
      api.googleAuth(idToken, role)
        .then(() => {
          if (role === "driver") router.replace("/driver-onboarding");
          else router.replace("/(tabs)/home");
        })
        .catch(() => setError("Google sign-in failed"))
        .finally(() => setGoogleLoading(false));
    } else if (response.type === "error") {
      setError("Google sign-in failed: " + (response.error?.description || "unknown error"));
    }
  }, [response]);

  const onContinue = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.login(email.trim(), password);
      if (role === "driver") router.replace("/driver-dashboard");
      else router.replace("/(tabs)/home");
    } catch {
      try {
        await api.register(email.trim(), password, role);
        if (role === "driver") router.replace("/driver-onboarding");
        else router.replace("/(tabs)/home");
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="auth-back-button"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.h1}>Welcome</Text>
        <Text style={styles.hSub}>Sign in to continue your journey</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetWrap}
      >
        <BlurView intensity={40} tint="dark" style={styles.sheet}>
          <View style={styles.grabber} />

          {/* Role toggle */}
          <View style={styles.toggleWrap} testID="role-toggle">
            <TouchableOpacity
              onPress={() => setRole("customer")}
              style={[styles.toggleBtn, role === "customer" && styles.toggleActive]}
              testID="role-customer"
            >
              <Text
                style={[
                  styles.toggleText,
                  role === "customer" && styles.toggleTextActive,
                ]}
              >
                I&apos;m a Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole("driver")}
              style={[styles.toggleBtn, role === "driver" && styles.toggleActive]}
              testID="role-driver"
            >
              <Text
                style={[
                  styles.toggleText,
                  role === "driver" && styles.toggleTextActive,
                ]}
              >
                I&apos;m a Driver
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
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

          {/* Password */}
          <Text style={styles.label}>Password</Text>
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

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={onContinue}
            activeOpacity={0.85}
            disabled={loading || googleLoading}
            testID="auth-continue-button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Sign in</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleBtn, (googleLoading || !request) && styles.ctaDisabled]}
            onPress={() => request && promptAsync()}
            activeOpacity={0.85}
            disabled={loading || googleLoading || !request}
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
          </TouchableOpacity>

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
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 28,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: "#fff" },
  toggleText: { color: colors.textMuted, fontWeight: "600", fontSize: 14 },
  toggleTextActive: { color: "#000" },
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
