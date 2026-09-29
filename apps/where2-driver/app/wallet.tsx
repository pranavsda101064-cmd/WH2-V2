import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";
import { SectionHeader, TransactionItem } from "@/src/components/ui";

type Tx = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  credit: boolean;
  date: string;
};

const STORE_KEY = "driver_wallet";
const TOPUPS = [100, 500, 1000];

const SEED_TXS: Tx[] = [
  {
    id: "seed-1",
    title: "Trip payout",
    subtitle: "Sakleshpura → Bisle Ghat · Sep 20",
    amount: 2199,
    credit: true,
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "seed-2",
    title: "Bank withdrawal",
    subtitle: "To HDFC ••4521 · Sep 18",
    amount: 2000,
    credit: false,
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Wallet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(100);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<{ balance: number; txs: Tx[] } | null>(STORE_KEY, null);
      if (saved) {
        setBalance(saved.balance);
        setTxs(saved.txs);
      } else {
        setBalance(100);
        setTxs(SEED_TXS);
        await storage.setItem(STORE_KEY, { balance: 100, txs: SEED_TXS });
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (b: number, t: Tx[]) => {
    setBalance(b);
    setTxs(t);
    await storage.setItem(STORE_KEY, { balance: b, txs: t });
  };

  const topUp = async (amt: number) => {
    const tx: Tx = {
      id: `tx-${Date.now()}`,
      title: "Wallet top-up",
      subtitle: `UPI · ${fmtDate(new Date().toISOString())}`,
      amount: amt,
      credit: true,
      date: new Date().toISOString(),
    };
    await persist(balance + amt, [tx, ...txs]);
  };

  const withdraw = () => {
    Alert.alert("Withdraw to bank", "Choose an amount", [
      ...[500, 1000, 2000].map((amt) => ({
        text: `₹${amt}`,
        onPress: async () => {
          if (amt > balance) {
            Alert.alert("Insufficient balance", `Your balance is ₹${balance}.`);
            return;
          }
          const tx: Tx = {
            id: `tx-${Date.now()}`,
            title: "Bank withdrawal",
            subtitle: `To HDFC ••4521 · ${fmtDate(new Date().toISOString())}`,
            amount: amt,
            credit: false,
            date: new Date().toISOString(),
          };
          await persist(balance - amt, [tx, ...txs]);
          Alert.alert("Withdrawn", `₹${amt} is on its way to your bank.`);
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const transfer = () => {
    Alert.alert("Transfer", "Driver-to-driver transfers are coming soon.");
  };

  const inOut = useMemo(() => {
    let inn = 0;
    let out = 0;
    txs.forEach((t) => (t.credit ? (inn += t.amount) : (out += t.amount)));
    return { inn, out };
  }, [txs]);

  return (
    <View style={x.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={0}>
          <View style={x.header}>
            <SpringPress style={x.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </SpringPress>
            <View style={{ flex: 1 }}>
              <Text style={x.kicker}>DRIVER WALLET</Text>
              <Text style={x.title}>Wallet</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={x.balanceCard}>
            <Text style={x.balLabel}>Available balance</Text>
            <Text style={x.balValue}>₹{balance.toLocaleString("en-IN")}</Text>
            <View style={x.topRow}>
              {TOPUPS.map((amt) => (
                <SpringPress key={amt} style={x.topChip} onPress={() => topUp(amt)} testID={`topup-${amt}`}>
                  <Text style={x.topChipText}>+{amt}</Text>
                </SpringPress>
              ))}
            </View>
            <View style={x.balActions}>
              <SpringPress style={x.withdrawBtn} onPress={withdraw} testID="withdraw-btn">
                <Ionicons name="arrow-up-outline" size={16} color={colors.accentDim} />
                <Text style={x.withdrawText}>Withdraw</Text>
              </SpringPress>
              <SpringPress style={x.transferBtn} onPress={transfer} testID="transfer-btn">
                <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
                <Text style={x.transferText}>Transfer</Text>
              </SpringPress>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <View style={x.ioRow}>
            <View style={x.ioCard}>
              <Ionicons name="arrow-down-circle-outline" size={18} color={colors.success} />
              <Text style={x.ioValue}>+₹{inOut.inn.toLocaleString("en-IN")}</Text>
              <Text style={x.ioLabel}>Money in</Text>
            </View>
            <View style={x.ioCard}>
              <Ionicons name="arrow-up-circle-outline" size={18} color={colors.danger} />
              <Text style={x.ioValue}>-₹{inOut.out.toLocaleString("en-IN")}</Text>
              <Text style={x.ioLabel}>Money out</Text>
            </View>
          </View>
        </FadeIn>

        <SectionHeader title="Transactions" right={`${txs.length} items`} />

        <View style={x.list}>
          {loaded &&
            txs.map((t, i) => (
              <FadeIn key={t.id} delay={Math.min(i * 60, 300)}>
                <TransactionItem
                  icon={t.credit ? "arrow-down-outline" : "arrow-up-outline"}
                  title={t.title}
                  subtitle={`${t.subtitle}`}
                  amount={`${t.credit ? "+" : "-"}₹${t.amount.toLocaleString("en-IN")}`}
                  credit={t.credit}
                  testID={`tx-${t.id}`}
                />
              </FadeIn>
            ))}
          {loaded && txs.length === 0 && (
            <View style={x.empty}>
              <Ionicons name="wallet-outline" size={28} color={colors.textDim} />
              <Text style={x.emptyText}>No transactions yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  balanceCard: {
    marginHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    padding: spacing.md,
    ...shadows.glow(colors.accentGlow),
  },
  balLabel: { color: "rgba(255,255,255,0.75)", fontSize: font.small, fontWeight: "600" },
  balValue: { color: "#fff", fontSize: 40, fontWeight: "800", marginTop: 2 },
  topRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  topChip: {
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topChipText: { color: "#fff", fontSize: font.small, fontWeight: "800" },
  balActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  withdrawBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  withdrawText: { color: colors.accentDim, fontSize: font.label, fontWeight: "800" },
  transferBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  transferText: { color: "#fff", fontSize: font.label, fontWeight: "800" },
  ioRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 12 },
  ioCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: "center",
    gap: 2,
    ...shadows.sm,
  },
  ioValue: { fontSize: font.title, fontWeight: "800", color: colors.text },
  ioLabel: { fontSize: font.micro, color: colors.textMuted, fontWeight: "600" },
  list: { paddingHorizontal: 16, marginTop: 4 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 40 },
  emptyText: { color: colors.textMuted, fontSize: font.small },
});
