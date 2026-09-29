import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { colors, radius, shadows } from "@/src/theme";
import { api } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";
import { BottomSheet } from "@/src/components/ui";

const LANGUAGES = ["English", "Hindi", "Telugu", "Kannada", "Bengali", "Marathi"];

const TERMS_TEXT = `1. Eligibility
You must hold a valid Indian driving license and vehicle documents to drive with Where2.

2. Service Area
Rides operate within the Sakleshpura region. Pickups outside the service area are disabled.

3. Fares & Payouts
Fares are calculated per trip as shown before acceptance. Payouts settle to your registered account.

4. Conduct
Maintain your vehicle, drive safely, and treat riders with respect. Violations may lead to review or suspension.

5. Documents
Keep your license, registration, insurance, and permits valid and up to date at all times.

6. Privacy
Your location is used only while you are online or on an active trip.`;

type Step = "personal" | "documents" | "vehicle" | "review";

const DOC_TYPES = [
  { key: "aadhaar", label: "Aadhaar Card", icon: "card-outline" },
  { key: "pan", label: "PAN Card", icon: "card-outline" },
  { key: "driving_license", label: "Driving License", icon: "car-outline" },
  { key: "psv_badge", label: "PSV Badge", icon: "shield-checkmark-outline" },
] as const;

const VEHICLE_TYPES = [
  { key: "sedan", label: "Sedan", icon: "car-sport-outline" },
  { key: "suv", label: "SUV", icon: "car-outline" },
  { key: "hatchback", label: "Hatchback", icon: "car-outline" },
  { key: "auto", label: "Auto", icon: "bus-outline" },
  { key: "bike", label: "Bike", icon: "bicycle-outline" },
] as const;

export default function DriverOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("personal");
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateStep = () => {
    slideAnim.setValue(30);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    animateStep();
  }, [step]);

  // Personal info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Documents
  const [docs, setDocs] = useState<Record<string, { uri: string; type: string; name: string }>>({});

  // Terms + language
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [language, setLanguage] = useState("English");
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    storage.getItem<string>("app_language", "English").then((saved) => {
      if (saved) setLanguage(saved);
    });
  }, []);

  // Vehicle
  const [vehicleType, setVehicleType] = useState("sedan");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [seats, setSeats] = useState("4");

  const pickPhoto = async (forDoc?: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (forDoc) {
        setDocs((prev) => ({
          ...prev,
          [forDoc]: { uri: asset.uri, type: "image/jpeg", name: `${forDoc}.jpg` },
        }));
      } else {
        setPhotoUri(asset.uri);
      }
    }
  };

  const takePhoto = async (forDoc?: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera permission needed");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (forDoc) {
        setDocs((prev) => ({
          ...prev,
          [forDoc]: { uri: asset.uri, type: "image/jpeg", name: `${forDoc}.jpg` },
        }));
      } else {
        setPhotoUri(asset.uri);
      }
    }
  };

  const submitProfile = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert("Error", "Name and phone are required");
      return false;
    }
    try {
      await api.createDriverProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        dob: dob.trim() || undefined,
        address: address.trim() || undefined,
      });
      return true;
    } catch {
      Alert.alert("Error", "Failed to create profile");
      return false;
    }
  };

  const submitDocs = async () => {
    try {
      for (const [docType, file] of Object.entries(docs)) {
        await api.uploadDocument(docType, file);
      }
      return true;
    } catch {
      Alert.alert("Error", "Failed to upload documents");
      return false;
    }
  };

  const submitVehicle = async () => {
    if (!regNumber.trim()) {
      Alert.alert("Error", "Registration number is required");
      return false;
    }
    try {
      await api.createVehicle({
        vehicle_type: vehicleType,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? parseInt(year) : undefined,
        reg_number: regNumber.trim().toUpperCase(),
        seats: parseInt(seats) || 4,
      });
      return true;
    } catch {
      Alert.alert("Error", "Failed to register vehicle");
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      Alert.alert("Terms required", "Please accept the Terms & Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    const profileOk = await submitProfile();
    if (!profileOk) { setLoading(false); return; }

    if (Object.keys(docs).length > 0) {
      const docsOk = await submitDocs();
      if (!docsOk) { setLoading(false); return; }
    }

    if (regNumber.trim()) {
      const vehicleOk = await submitVehicle();
      if (!vehicleOk) { setLoading(false); return; }
    }

    setLoading(false);
    Alert.alert("Success", "Your application has been submitted for review!", [
      { text: "OK", onPress: () => router.replace("/(tabs)") },
    ]);
  };

  if (loading) return <LoadingScreen message="Submitting your application..." />;

  const steps: Step[] = ["personal", "documents", "vehicle", "review"];
  const currentIdx = steps.indexOf(step);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <SpringPress style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </SpringPress>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headKicker}>DRIVER ONBOARDING</Text>
          <Text style={styles.headTitle}>Step {currentIdx + 1} of 4</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.progressDot, i <= currentIdx && styles.progressDotActive]} />
        ))}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
        {/* Step 1: Personal Info */}
        {step === "personal" && (
          <View>
            <FadeIn delay={0}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </FadeIn>

            {/* Profile photo */}
            <SpringPress style={styles.photoBtn} onPress={() => Alert.alert("Photo", "Choose an option", [
              { text: "Camera", onPress: () => takePhoto() },
              { text: "Gallery", onPress: () => pickPhoto() },
              { text: "Cancel" },
            ])}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={28} color={colors.textMuted} />
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
            </SpringPress>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Ravi Kumar" placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>Date of Birth</Text>
            <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>App Language</Text>
            <SpringPress style={styles.langRow} onPress={() => setLangOpen(true)}>
              <Ionicons name="language-outline" size={18} color={colors.accent} />
              <Text style={styles.langText}>{language}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </SpringPress>

            <Text style={styles.label}>Address</Text>
            <View style={styles.permCard}>
              <View style={styles.permIcon}>
                <Ionicons name="location-outline" size={26} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.permTitle}>Enable location</Text>
                <Text style={styles.permSub}>We use GPS to find rides near you</Text>
              </View>
              <SpringPress
                style={styles.permBtn}
                onPress={async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== "granted") { Alert.alert("Permission needed for GPS"); return; }
                  setLoading(true);
                  try {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    const res = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&format=json`,
                      { headers: { "User-Agent": "Where2App/1.0" } },
                    );
                    const data = await res.json();
                    setAddress(data.display_name || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
                  } catch { Alert.alert("Error", "Could not get address"); }
                  setLoading(false);
                }}
              >
                <Ionicons name="locate" size={16} color="#fff" />
                <Text style={styles.permBtnText}>Allow</Text>
              </SpringPress>
            </View>
            <TextInput style={[styles.input, { height: 80 }]} value={address} onChangeText={setAddress} multiline textAlignVertical="top" placeholder="Hassan Road, Sakleshpura" placeholderTextColor={colors.textDim} />
          </View>
        )}

        {/* Step 2: Documents */}
        {step === "documents" && (
          <View>
            <Text style={styles.sectionTitle}>Identity Documents</Text>
            <Text style={styles.sectionSub}>Upload clear photos of each document</Text>

            {DOC_TYPES.map((doc) => {
              const uploaded = docs[doc.key];
              return (
                <View key={doc.key} style={[styles.docCard, uploaded && styles.docCardDone]}>
                  {uploaded ? (
                    <Image source={{ uri: uploaded.uri }} style={styles.docThumb} />
                  ) : (
                    <View style={styles.docIcon}>
                      <Ionicons name={doc.icon as any} size={22} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docLabel}>{doc.label}</Text>
                    <View style={[styles.statusChip, uploaded ? styles.statusChipDone : styles.statusChipTodo]}>
                      <Text style={[styles.statusChipText, uploaded ? styles.statusChipTextDone : styles.statusChipTextTodo]}>
                        {uploaded ? "Uploaded ✓" : "Tap below to upload"}
                      </Text>
                    </View>
                  </View>
                  {uploaded && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
                  <View style={styles.docBtns}>
                    <SpringPress style={styles.docBtn} onPress={() => takePhoto(doc.key)}>
                      <Ionicons name="camera-outline" size={18} color={colors.accent} />
                    </SpringPress>
                    <SpringPress style={styles.docBtn} onPress={() => pickPhoto(doc.key)}>
                      <Ionicons name="image-outline" size={18} color={colors.accent} />
                    </SpringPress>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Step 3: Vehicle */}
        {step === "vehicle" && (
          <View>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>

            <Text style={styles.label}>Vehicle Type *</Text>
            <View style={styles.typeRow}>
              {VEHICLE_TYPES.map((vt) => (
                <SpringPress
                  key={vt.key}
                  style={[styles.typeBtn, vehicleType === vt.key && styles.typeBtnActive]}
                  onPress={() => setVehicleType(vt.key)}
                >
                  <Ionicons name={vt.icon as any} size={20} color={vehicleType === vt.key ? colors.accent : colors.textDim} />
                  <Text style={[styles.typeLabel, vehicleType === vt.key && { color: colors.accent }]}>{vt.label}</Text>
                </SpringPress>
              ))}
            </View>

            <Text style={styles.label}>Make</Text>
            <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="Maruti Suzuki" placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>Model</Text>
            <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Ertiga" placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>Year</Text>
            <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2022" placeholderTextColor={colors.textDim} />

            <Text style={styles.label}>Registration Number *</Text>
            <TextInput style={styles.input} value={regNumber} onChangeText={setRegNumber} placeholder="KA 13 X 4421" placeholderTextColor={colors.textDim} autoCapitalize="characters" />

            <Text style={styles.label}>Seats</Text>
            <TextInput style={styles.input} value={seats} onChangeText={setSeats} keyboardType="number-pad" placeholder="4" placeholderTextColor={colors.textDim} />
          </View>
        )}

        {/* Step 4: Review */}
        {step === "review" && (
          <View>
            <Text style={styles.sectionTitle}>Review & Submit</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewHead}>Personal Info</Text>
              <Text style={styles.reviewItem}>Name: {fullName || "—"}</Text>
              <Text style={styles.reviewItem}>Phone: {phone || "—"}</Text>
              <Text style={styles.reviewItem}>DOB: {dob || "—"}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewHead}>Documents</Text>
              {DOC_TYPES.map((doc) => (
                <Text key={doc.key} style={styles.reviewItem}>
                  {doc.label}: {docs[doc.key] ? "Uploaded" : "Not uploaded"}
                </Text>
              ))}
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewHead}>Vehicle</Text>
              <Text style={styles.reviewItem}>Type: {vehicleType}</Text>
              <Text style={styles.reviewItem}>Make: {make || "—"}</Text>
              <Text style={styles.reviewItem}>Model: {model || "—"}</Text>
              <Text style={styles.reviewItem}>Reg: {regNumber || "—"}</Text>
              <Text style={styles.reviewItem}>Seats: {seats}</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>
                Your documents will be verified by our admin team. You&apos;ll be notified once approved.
              </Text>
            </View>

            <SpringPress style={styles.termsRow} onPress={() => setTermsAccepted((v) => !v)}>
              <View style={[styles.checkbox, termsAccepted && styles.checkboxOn]}>
                {termsAccepted && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                I accept the <Text style={styles.termsLink} onPress={() => setTermsOpen(true)}>Terms & Privacy Policy</Text>
              </Text>
            </SpringPress>
          </View>
        )}
        </Animated.View>
      </KeyboardAwareScrollView>

      <BottomSheet
        visible={termsOpen}
        title="Terms & Privacy Policy"
        subtitle="Please read before submitting"
        onClose={() => setTermsOpen(false)}
        actionLabel={termsAccepted ? "Accepted ✓" : "Accept & Continue"}
        onAction={() => { setTermsAccepted(true); setTermsOpen(false); }}
        testID="terms-sheet"
      >
        <Text style={styles.termsBody}>{TERMS_TEXT}</Text>
      </BottomSheet>

      <BottomSheet
        visible={langOpen}
        title="App Language"
        subtitle="Choose your preferred language"
        onClose={() => setLangOpen(false)}
        testID="language-sheet"
      >
        {LANGUAGES.map((lng) => (
          <SpringPress
            key={lng}
            style={[styles.langOption, language === lng && styles.langOptionActive]}
            onPress={async () => {
              setLanguage(lng);
              await storage.setItem("app_language", lng);
              setLangOpen(false);
            }}
          >
            <Text style={[styles.langOptionText, language === lng && { color: colors.accent }]}>
              {lng}
            </Text>
            {language === lng && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
          </SpringPress>
        ))}
      </BottomSheet>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {currentIdx > 0 && (
          <SpringPress style={styles.backBtn} onPress={() => setStep(steps[currentIdx - 1])}>
            <Text style={styles.backText}>Back</Text>
          </SpringPress>
        )}
        <SpringPress
          style={[styles.nextBtn, currentIdx === steps.length - 1 && styles.submitBtn]}
          onPress={() => {
            if (currentIdx < steps.length - 1) {
              setStep(steps[currentIdx + 1]);
            } else {
              handleSubmit();
            }
          }}
        >
          <Text style={styles.nextText}>
            {currentIdx === steps.length - 1 ? "Submit Application" : "Continue"}
          </Text>
          {currentIdx < steps.length - 1 && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </SpringPress>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headKicker: { color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 2 },
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.accent, width: 24 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 4 },
  sectionSub: { color: colors.textMuted, fontSize: 13, marginBottom: 20 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 12, letterSpacing: 0.5 },
  input: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  photoBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  photoText: { color: colors.textMuted, fontSize: 10 },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginBottom: 10,
  },
  docCardDone: {
    borderStyle: "solid",
    borderColor: colors.success,
  },
  docThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  statusChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  statusChipDone: { backgroundColor: "rgba(34,197,94,0.12)" },
  statusChipTodo: { backgroundColor: "rgba(245,158,11,0.12)" },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  statusChipTextDone: { color: colors.success },
  statusChipTextTodo: { color: colors.pending },
  docBtns: { flexDirection: "row", gap: 8 },
  docBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  langText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "600" },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langOptionActive: { borderBottomColor: colors.accent },
  langOptionText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  permCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    ...shadows.sm,
  },
  permIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  permTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  permSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  permBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  permBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  termsText: { flex: 1, color: colors.textMuted, fontSize: 13 },
  termsLink: { color: colors.accent, fontWeight: "700" },
  termsBody: { color: colors.text, fontSize: 14, lineHeight: 22 },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  docLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  docStatus: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  typeBtn: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBtnActive: { borderColor: colors.accent, backgroundColor: "rgba(0,137,123,0.1)" },
  typeLabel: { color: colors.text, fontSize: 13, fontWeight: "600" },
  reviewCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  reviewHead: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  reviewItem: { color: colors.text, fontSize: 14, marginBottom: 4 },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: "rgba(0,137,123,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,137,123,0.2)",
    marginTop: 8,
  },
  infoText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  backBtn: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtn: { backgroundColor: colors.success },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(0,137,123,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,137,123,0.2)",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  gpsBtnText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  nextText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
