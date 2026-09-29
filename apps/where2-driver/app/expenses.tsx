import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
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

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";
import { BottomSheet, PrimaryButton, SectionHeader, TransactionItem } from "@/src/components/ui";

export type Expense = {
  id: string;
  amount: number;
  category: string;
  note: string;
  vendor: string;
  date: string;
  receiptUri?: string;
};

const CATEGORIES = [
  { key: "Fuel", icon: "flame-outline" as const, tint: colors.danger },
  { key: "Toll", icon: "ticket-outline" as const, tint: colors.pending },
  { key: "Maintenance", icon: "construct-outline" as const, tint: colors.accent },
  { key: "Food & Stay", icon: "restaurant-outline" as const, tint: colors.accentDim },
];

const FILTERS = ["All", ...CATEGORIES.map((c) => c.key)];
const STORE_KEY = "driver_expenses";

function catMeta(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Expenses() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState("All");
  const [logOpen, setLogOpen] = useState(false);
  const [detail, setDetail] = useState<Expense | null>(null);

  // Log form
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Fuel");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);

  useEffect(() => {
    storage.getItem<Expense[]>(STORE_KEY, []).then((saved) => {
      if (saved) setExpenses(saved);
    });
  }, []);

  const persist = async (next: Expense[]) => {
    setExpenses(next);
    await storage.setItem(STORE_KEY, next);
  };

  const filtered = useMemo(
    () => (filter === "All" ? expenses : expenses.filter((e) => e.category === filter)),
    [expenses, filter],
  );

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const weekBars = useMemo(() => {
    const days: number[] = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    expenses.forEach((e) => {
      const d = Math.floor((now.getTime() - new Date(e.date).getTime()) / 86400000);
      if (d >= 0 && d < 7) days[6 - d] += e.amount;
    });
    const max = Math.max(1, ...days);
    return days.map((v) => v / max);
  }, [expenses]);

  const attachReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) setReceipt(result.assets[0].uri);
  };

  const saveExpense = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than zero.");
      return;
    }
    const entry: Expense = {
      id: `exp-${Date.now()}`,
      amount: Math.round(val),
      category,
      note: note.trim() || category,
      vendor: note.trim() || category,
      date: new Date().toISOString(),
      receiptUri: receipt ?? undefined,
    };
    await persist([entry, ...expenses]);
    setAmount("");
    setNote("");
    setReceipt(null);
    setCategory("Fuel");
    setLogOpen(false);
  };

  return (
    <View style={x.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={0}>
          <View style={x.header}>
            <SpringPress style={x.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </SpringPress>
            <View style={{ flex: 1 }}>
              <Text style={x.kicker}>TRACK SPENDING</Text>
              <Text style={x.title}>Expenses</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={x.summary}>
            <Text style={x.sumLabel}>Total spending</Text>
            <Text style={x.sumValue}>₹{total.toLocaleString("en-IN")}</Text>
            <Text style={x.sumSub}>
              {expenses.length} {expenses.length === 1 ? "entry" : "entries"} · last 7 days
            </Text>
            <View style={x.bars}>
              {weekBars.map((h, i) => (
                <View key={i} style={x.barTrack}>
                  <View style={[x.barFill, { flex: Math.max(h, 0.06) }]} />
                  <View style={{ flex: 1 - Math.max(h, 0.06) }} />
                </View>
              ))}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={x.chips}
          >
            {FILTERS.map((f) => (
              <SpringPress
                key={f}
                style={[x.chip, filter === f && x.chipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[x.chipText, filter === f && x.chipTextActive]}>{f}</Text>
              </SpringPress>
            ))}
          </ScrollView>
        </FadeIn>

        <SectionHeader title="History" right={`${filtered.length} items`} />

        <View style={x.list}>
          {filtered.map((e, i) => {
            const meta = catMeta(e.category);
            return (
              <FadeIn key={e.id} delay={Math.min(i * 60, 300)}>
                <TransactionItem
                  icon={meta.icon}
                  tint={meta.tint}
                  title={e.vendor}
                  subtitle={`${e.category} · ${fmtDate(e.date)}`}
                  amount={`-₹${e.amount.toLocaleString("en-IN")}`}
                  onPress={() => setDetail(e)}
                  testID={`expense-${e.id}`}
                />
              </FadeIn>
            );
          })}
          {filtered.length === 0 && (
            <View style={x.empty}>
              <Ionicons name="receipt-outline" size={28} color={colors.textDim} />
              <Text style={x.emptyText}>No expenses yet. Tap + to log one.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <SpringPress style={[x.fab, { bottom: insets.bottom + 24 }]} onPress={() => setLogOpen(true)} testID="log-expense-fab">
        <Ionicons name="add" size={26} color="#fff" />
      </SpringPress>

      {/* Log expense sheet */}
      <BottomSheet
        visible={logOpen}
        title="Log expense"
        subtitle="Fuel, toll, repairs, food & stay"
        onClose={() => setLogOpen(false)}
        actionLabel="Save expense"
        onAction={saveExpense}
        testID="log-expense-sheet"
      >
        <Text style={x.amtLabel}>Amount</Text>
        <View style={x.amtRow}>
          <Text style={x.rupee}>₹</Text>
          <TextInput
            style={x.amtInput}
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textDim}
            testID="expense-amount"
          />
        </View>
        <Text style={x.fieldLabel}>Category</Text>
        <View style={x.catGrid}>
          {CATEGORIES.map((c) => (
            <SpringPress
              key={c.key}
              style={[x.catTile, category === c.key && { borderColor: c.tint, backgroundColor: `${c.tint}14` }]}
              onPress={() => setCategory(c.key)}
            >
              <Ionicons name={c.icon} size={20} color={category === c.key ? c.tint : colors.textDim} />
              <Text style={[x.catText, category === c.key && { color: colors.text }]}>{c.key}</Text>
            </SpringPress>
          ))}
        </View>
        <Text style={x.fieldLabel}>Note / vendor</Text>
        <TextInput
          style={x.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Shell bunk, Hassan road…"
          placeholderTextColor={colors.textDim}
        />
        <Text style={x.fieldLabel}>Receipt</Text>
        {receipt ? (
          <View style={x.receiptRow}>
            <Image source={{ uri: receipt }} style={x.receiptThumb} />
            <Text style={x.receiptName} numberOfLines={1}>
              Bill attached
            </Text>
            <SpringPress style={x.receiptX} onPress={() => setReceipt(null)}>
              <Ionicons name="close" size={16} color={colors.danger} />
            </SpringPress>
          </View>
        ) : (
          <SpringPress style={x.receiptAdd} onPress={attachReceipt}>
            <Ionicons name="camera-outline" size={18} color={colors.accent} />
            <Text style={x.receiptAddText}>Attach bill photo</Text>
          </SpringPress>
        )}
      </BottomSheet>

      {/* Receipt detail sheet */}
      <BottomSheet
        visible={!!detail}
        title="Receipt"
        subtitle={detail ? `${detail.category} · ${fmtDate(detail.date)}` : undefined}
        onClose={() => setDetail(null)}
        testID="receipt-sheet"
      >
        {detail ? (
          <View>
            {detail.receiptUri ? (
              <Image source={{ uri: detail.receiptUri }} style={x.receiptBig} resizeMode="cover" />
            ) : null}
            <Row k="Vendor" v={detail.vendor} />
            <Row k="Category" v={detail.category} />
            <Row k="Date" v={new Date(detail.date).toLocaleString("en-IN")} />
            <Row k="Amount" v={`₹${detail.amount.toLocaleString("en-IN")}`} bold />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <View style={x.row}>
      <Text style={x.rowK}>{k}</Text>
      <Text style={[x.rowV, bold && { fontWeight: "800", color: colors.text }]}>{v}</Text>
    </View>
  );
}

const x = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  kicker: { color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
  summary: {
    marginHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    padding: spacing.md,
    ...shadows.glow(colors.accentGlow),
  },
  sumLabel: { color: "rgba(255,255,255,0.75)", fontSize: font.small, fontWeight: "600" },
  sumValue: { color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 2 },
  sumSub: { color: "rgba(255,255,255,0.75)", fontSize: font.caption, marginTop: 2 },
  bars: { flexDirection: "row", gap: 6, marginTop: 12, height: 44, alignItems: "stretch" },
  barTrack: { flex: 1, flexDirection: "column", justifyContent: "flex-end" },
  barFill: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 3, minHeight: 4 },
  chips: { paddingHorizontal: 16, gap: 8, marginTop: 14 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: font.small, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  list: { paddingHorizontal: 16, marginTop: 4 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 40 },
  emptyText: { color: colors.textMuted, fontSize: font.small },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.accentGlow),
  },
  amtLabel: { color: colors.textMuted, fontSize: font.caption, fontWeight: "700", marginBottom: 2 },
  amtRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  rupee: { fontSize: 32, fontWeight: "800", color: colors.textMuted },
  amtInput: { fontSize: 44, fontWeight: "800", color: colors.text, minWidth: 120 },
  fieldLabel: { color: colors.textMuted, fontSize: font.caption, fontWeight: "700", marginBottom: 8, marginTop: 6 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catTile: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
  },
  catText: { fontSize: font.small, fontWeight: "700", color: colors.textMuted },
  noteInput: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: font.body,
  },
  receiptAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    padding: 14,
  },
  receiptAddText: { color: colors.accent, fontSize: font.label, fontWeight: "700" },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 8,
  },
  receiptThumb: { width: 48, height: 48, borderRadius: radius.sm },
  receiptName: { flex: 1, color: colors.text, fontSize: font.label, fontWeight: "600" },
  receiptX: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptBig: { height: 180, borderRadius: radius.md, marginBottom: 12, backgroundColor: colors.surfaceAlt },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowK: { color: colors.textMuted, fontSize: font.label },
  rowV: { color: colors.textMuted, fontSize: font.label, fontWeight: "600" },
});
