import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
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

import { LinearGradient } from "expo-linear-gradient";

import { colors, radius } from "@/src/theme";
import { api, DriverProfile, DriverDocument, DriverVehicle } from "@/src/api";
import { LoadingScreen } from "@/src/components/loading";
import { FadeIn } from "@/src/components/fade-in";
import { SpringPress } from "@/src/components/spring-press";

const DOC_TYPES = [
  { key: "aadhaar", label: "Aadhaar Card" },
  { key: "pan", label: "PAN Card" },
  { key: "driving_license", label: "Driving License" },
  { key: "psv_badge", label: "PSV Badge" },
] as const;

export default function DriverProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    Promise.all([api.getDriverProfile(), api.listDocuments(), api.listVehiclesDriver()])
      .then(([p, d, v]) => { setProfile(p); setDocuments(d); setVehicles(v); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startEditing = () => {
    if (!profile) return;
    setEditName(profile.full_name);
    setEditPhone(profile.phone);
    setEditAddress(profile.address || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim() || undefined,
      });
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setEditing(false);
    } catch {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading profile..." />;

  if (!profile) {
    // Load failed (offline/server) — offer retry instead of the onboarding empty state
    if (loadError) {
      return (
        <View style={styles.root}>
          <StatusBar style="light" />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 16 }}>Couldn&apos;t load profile</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
              Check your connection and try again.
            </Text>
            <TouchableOpacity
              style={{ marginTop: 24, backgroundColor: colors.accent, paddingHorizontal: 32, height: 52, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 8 }}
              onPress={loadData}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Ionicons name="person-add-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 16 }}>Complete Your Profile</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            Set up your driver profile, upload documents, and register your vehicle to start earning.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, backgroundColor: colors.accent, paddingHorizontal: 32, height: 52, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 8 }}
            onPress={() => router.push("/driver-onboarding")}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Start Onboarding</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.replace("/")}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="driver-screen">
      <LinearGradient
        colors={["rgba(0,137,123,0.07)", "rgba(0,137,123,0.02)", colors.bg]}
        locations={[0, 0.35, 0.55]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.h1}>Profile</Text>
          </View>
        </FadeIn>

        {/* Profile card */}
        <FadeIn delay={100}>
          <View style={styles.profileCard}>
            <View>
              <Image
                source={{
                  uri: profile.photo_url || "https://api.dicebear.com/10.x/adventurer-neutral/png?seed=driver&size=128&backgroundColor=transparent",
                }}
                style={styles.avatar}
              />
              <View style={styles.avatarBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile.full_name}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={12} color={colors.pending} />
                  <Text style={styles.rating}>
                    {profile.avg_rating != null ? profile.avg_rating.toFixed(1) : "New"}
                  </Text>
                </View>
                <View style={styles.tripPill}>
                  <Text style={styles.tripCount}>{profile.total_trips} trips</Text>
                </View>
              </View>
              <Text style={styles.statusLine}>{profile.status}</Text>
            </View>
            <TouchableOpacity style={styles.uploadBtn} testID="upload-photo-button" onPress={async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission needed", "Please grant photo library access to upload a profile picture.");
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                try {
                  const file = result.assets[0];
                  const uploaded = await api.uploadAvatar({
                    uri: file.uri,
                    type: "image/jpeg",
                    name: "avatar.jpg",
                  });
                  setProfile((prev) => prev ? { ...prev, photo_url: uploaded.avatar_url } : prev);
                } catch {
                  Alert.alert("Error", "Failed to upload photo");
                }
              }
            }}>
              <Ionicons name="camera-outline" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Personal */}
        <FadeIn delay={200}>
          <Section
            title="Personal information"
            action={
              editing ? (
                <TouchableOpacity onPress={() => setEditing(false)}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={startEditing}>
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>Edit</Text>
                </TouchableOpacity>
              )
            }
          >
            {editing ? (
              <>
                <EditField label="Full name" value={editName} onChangeText={setEditName} />
                <EditField label="Contact number" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
                <EditField label="Address" value={editAddress} onChangeText={setEditAddress} last />
              </>
            ) : (
              <>
                <Field label="Full name" value={profile.full_name} />
                <Field label="Contact number" value={profile.phone} />
                <Field label="Address" value={profile.address || "—"} last />
              </>
            )}
          </Section>
        </FadeIn>

        {editing && (
          <FadeIn delay={50}>
            <SpringPress onPress={saveProfile} disabled={saving}>
              <View style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
              </View>
            </SpringPress>
          </FadeIn>
        )}

        {/* Documents */}
        <FadeIn delay={300}>
          <Section title="Documents">
            {DOC_TYPES.map((doc, i) => {
              const found = documents.find((d) => d.doc_type === doc.key);
              const status = !found
                ? ("missing" as const)
                : found.verification_status === "verified"
                  ? ("verified" as const)
                  : ("review" as const);
              return (
                <Field
                  key={doc.key}
                  label={doc.label}
                  value={found ? (status === "verified" ? "Verified" : "Under Review") : "Not uploaded"}
                  status={status}
                  last={i === DOC_TYPES.length - 1}
                />
              );
            })}
          </Section>
        </FadeIn>

        {/* Vehicle */}
        <FadeIn delay={400}>
          <Section title="Vehicle">
            {vehicles.length > 0 ? (
              <>
                <Field label="Type" value={vehicles[0].vehicle_type} />
                <Field label="Make / Model" value={[vehicles[0].make, vehicles[0].model].filter(Boolean).join(" ") || "—"} />
                <Field label="Registration" value={vehicles[0].reg_number} />
                <Field label="Seats" value={String(vehicles[0].seats)} last />
              </>
            ) : (
              <Field label="Vehicle" value="No vehicle registered" last />
            )}
          </Section>
        </FadeIn>

        <FadeIn delay={500}>
          <TouchableOpacity
            style={{ marginTop: 20, alignItems: "center", paddingVertical: 14 }}
            onPress={() => router.push("/driver-onboarding")}
          >
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>Update Profile & Documents</Text>
          </TouchableOpacity>
        </FadeIn>

        <FadeIn delay={550}>
          <Section title="Help & Legal">
            <TouchableOpacity style={[styles.field, styles.fieldDivider]} onPress={() => router.push("/support")}>
              <Ionicons name="headset-outline" size={18} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Support Center</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.field, styles.fieldDivider]} onPress={() => router.push("/privacy")}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.field} onPress={() => router.push("/terms")}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
          </Section>
        </FadeIn>

        <FadeIn delay={600}>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={async () => {
              await api.logout();
              router.replace("/");
            }}
            testID="driver-signout-button"
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  verified,
  status,
  last,
}: {
  label: string;
  value: string;
  verified?: boolean;
  status?: "verified" | "review" | "missing";
  last?: boolean;
}) {
  const chip = status ?? (verified ? "verified" : undefined);
  return (
    <View style={[styles.field, !last && styles.fieldDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      {chip === "verified" && (
        <View style={[styles.statusChip, { backgroundColor: "rgba(34,197,94,0.10)" }]}>
          <Ionicons name="shield-checkmark" size={11} color={colors.success} />
          <Text style={[styles.statusChipText, { color: colors.success }]}>Verified</Text>
        </View>
      )}
      {chip === "review" && (
        <View style={[styles.statusChip, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
          <Ionicons name="time-outline" size={11} color={colors.pending} />
          <Text style={[styles.statusChipText, { color: colors.pending }]}>Review</Text>
        </View>
      )}
      {chip === "missing" && (
        <View style={[styles.statusChip, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="cloud-upload-outline" size={11} color={colors.textDim} />
          <Text style={[styles.statusChipText, { color: colors.textMuted }]}>Upload</Text>
        </View>
      )}
    </View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  last,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "phone-pad";
  last?: boolean;
}) {
  return (
    <View style={[styles.field, !last && styles.fieldDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.editInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "phone-pad" ? "none" : "words"}
          placeholderTextColor={colors.textDim}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  h1: { color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  profileCard: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: "#fff", fontSize: 19, fontWeight: "800" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rating: { color: "#fff", fontSize: 12, fontWeight: "800" },
  tripPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tripCount: { color: "#fff", fontSize: 12, fontWeight: "700" },
  statusLine: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
    textTransform: "capitalize",
  },
  uploadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fieldLabel: { color: colors.textMuted, fontSize: 12 },
  fieldValue: { color: colors.text, fontSize: 15, fontWeight: "500", marginTop: 3 },
  editInput: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
    marginTop: 3,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: { color: colors.text, fontSize: 15, fontWeight: "700" },
});
