import { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius } from "@/src/theme";

const BG =
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1400&q=80";

type Role = "customer" | "driver";

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>("customer");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const onContinue = () => {
    if (step === "phone") {
      setStep("otp");
      return;
    }
    if (role === "driver") router.replace("/driver");
    else router.replace("/(tabs)/home");
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

          {step === "phone" ? (
            <>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.input}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textDim}
                  style={styles.inputText}
                  maxLength={10}
                  testID="phone-input"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter OTP</Text>
              <Text style={styles.otpHint}>
                We sent a code to +91 {phone || "98765 43210"}
              </Text>
              <View style={styles.input}>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.textDim}
                  style={[styles.inputText, styles.otpInput]}
                  maxLength={6}
                  testID="otp-input"
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.cta}
            onPress={onContinue}
            activeOpacity={0.85}
            testID="auth-continue-button"
          >
            <Text style={styles.ctaText}>
              {step === "phone" ? "Continue" : "Verify & Sign in"}
            </Text>
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
  otpHint: { color: colors.textMuted, fontSize: 13, marginBottom: 10, marginTop: -4 },
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
  prefix: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 10,
  },
  inputText: { flex: 1, color: "#fff", fontSize: 16 },
  otpInput: { letterSpacing: 6, fontSize: 20, fontWeight: "700" },
  cta: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  legal: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
  },
});
