import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Alert, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const INITIAL_ADDRESSES: SavedAddress[] = [
  { id: "a1", label: "Home", address: "Sakleshpura Town Center, KA 573134", icon: "home-outline" },
  { id: "a2", label: "Office", address: "Coffee Estate Road, Sakleshpura", icon: "briefcase-outline" },
  { id: "a3", label: "Hotel", address: "Green Route Homestay, Bisle Road", icon: "bed-outline" },
];

const ADDRESS_TYPES: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Home", icon: "home-outline" },
  { label: "Work", icon: "briefcase-outline" },
  { label: "Gym", icon: "barbell-outline" },
  { label: "Other", icon: "location-outline" },
];

export default function SavedAddresses() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<SavedAddress[]>(INITIAL_ADDRESSES);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIcon, setNewIcon] = useState<keyof typeof Ionicons.glyphMap>("location-outline");

  const handleDelete = (id: string) => {
    Alert.alert("Remove address", "Are you sure you want to remove this saved address?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setAddresses(addresses.filter((a) => a.id !== id)) },
    ]);
  };

  const handleAdd = () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      Alert.alert("Missing info", "Please enter both a label and address.");
      return;
    }
    const entry: SavedAddress = {
      id: "a" + Date.now(),
      label: newLabel.trim(),
      address: newAddress.trim(),
      icon: newIcon,
    };
    setAddresses([...addresses, entry]);
    setNewLabel("");
    setNewAddress("");
    setNewIcon("location-outline");
    setShowAdd(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <SpringPress style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </SpringPress>
          <Text style={styles.h1}>Saved Addresses</Text>
        </View>

        {addresses.map((addr, i) => (
          <FadeIn key={addr.id} delay={i * 60}>
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name={addr.icon} size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{addr.label}</Text>
                <Text style={styles.cardAddress} numberOfLines={1}>{addr.address}</Text>
              </View>
              <SpringPress style={styles.deleteBtn} onPress={() => handleDelete(addr.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </SpringPress>
            </View>
          </FadeIn>
        ))}

        {showAdd && (
          <FadeIn>
            <View style={styles.addForm}>
              <Text style={styles.addFormTitle}>New Address</Text>
              <View style={styles.typeRow}>
                {ADDRESS_TYPES.map((t) => (
                  <SpringPress
                    key={t.label}
                    style={[styles.typeBtn, newIcon === t.icon && styles.typeBtnActive]}
                    onPress={() => setNewIcon(t.icon)}
                  >
                    <Ionicons name={t.icon} size={16} color={newIcon === t.icon ? "#fff" : colors.textDim} />
                    <Text style={[styles.typeText, newIcon === t.icon && styles.typeTextActive]}>{t.label}</Text>
                  </SpringPress>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="Label (e.g. Home)"
                placeholderTextColor={colors.textDim}
              />
              <TextInput
                style={styles.input}
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="Full address"
                placeholderTextColor={colors.textDim}
              />
              <View style={styles.addFormActions}>
                <SpringPress style={styles.cancelFormBtn} onPress={() => setShowAdd(false)}>
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </SpringPress>
                <SpringPress style={styles.saveFormBtn} onPress={handleAdd}>
                  <Text style={styles.saveFormText}>Save</Text>
                </SpringPress>
              </View>
            </View>
          </FadeIn>
        )}

        {!showAdd && (
          <FadeIn delay={addresses.length * 60}>
            <SpringPress
              style={styles.addBtn}
              onPress={() => setShowAdd(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.addText}>Add new address</Text>
            </SpringPress>
          </FadeIn>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 20, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  h1: { color: colors.text, fontSize: font.title, fontWeight: "800" },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 20, marginBottom: 10, padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(30,107,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  cardLabel: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  cardAddress: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 20, marginTop: 10, height: 52, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent, borderStyle: "dashed",
  },
  addText: { color: colors.accent, fontSize: font.body, fontWeight: "600" },
  addForm: {
    marginHorizontal: 20, marginTop: 10, padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  addFormTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: "700", marginBottom: 12 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  typeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 36,
    borderRadius: 18, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
  },
  typeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  typeText: { color: colors.textDim, fontSize: font.caption, fontWeight: "600" },
  typeTextActive: { color: "#fff" },
  input: {
    height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
    color: colors.text, fontSize: font.label, marginBottom: 10,
  },
  addFormActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelFormBtn: {
    flex: 1, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  cancelFormText: { color: colors.textDim, fontSize: font.label, fontWeight: "600" },
  saveFormBtn: {
    flex: 1, height: 44, borderRadius: radius.md, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  saveFormText: { color: "#fff", fontSize: font.label, fontWeight: "700" },
});
