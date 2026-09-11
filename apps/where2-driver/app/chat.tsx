import { useEffect, useRef, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing } from "@/src/theme";
import { api, getUserId } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";

const QUICK_REPLIES = [
  "On my way to you",
  "I've arrived at pickup",
  "Please share your location",
  "Traffic delay, 5 min out",
  "Heading to drop-off now",
  "Call me",
];

type Message = {
  id: string;
  text: string;
  sent: boolean;
  time: string;
};

function formatTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function DriverChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rideId, riderName, riderPhone } = useLocalSearchParams<{
    rideId: string;
    riderName: string;
    riderPhone: string;
  }>();

  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!rideId) return;
    (async () => {
      const id = await getUserId();
      if (id) setUserId(id);
      try {
        const msgs = await api.listMessages(rideId);
        if (msgs.length === 0) {
          setMessages([{
            id: "system-1",
            text: `Chat with ${riderName || "your rider"}. Send a message or pick a quick reply below.`,
            sent: false,
            time: formatTime(),
          }]);
        } else {
          setMessages(msgs.map((m) => ({
            id: m.id,
            text: m.text,
            sent: m.sender_id === id,
            time: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          })));
        }
      } catch {
        setMessages([{
          id: "system-1",
          text: `Chat with ${riderName || "your rider"}. Send a message or pick a quick reply below.`,
          sent: false,
          time: formatTime(),
        }]);
      }
    })();

    pollRef.current = setInterval(() => {
      if (rideId) api.listMessages(rideId).catch(() => {});
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [rideId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !rideId) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      text: text.trim(),
      sent: true,
      time: formatTime(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    api.sendMessage(rideId, text.trim()).catch(() => {});
  };

  const handleCall = () => {
    if (riderPhone) Linking.openURL(`tel:${riderPhone}`);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.msgBubble,
        item.sent ? styles.msgSent : styles.msgReceived,
      ]}
    >
      <Text style={[styles.msgText, item.sent && styles.msgTextSent]}>
        {item.text}
      </Text>
      <Text style={[styles.msgTime, item.sent && styles.msgTimeSent]}>
        {item.time}
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <SpringPress style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </SpringPress>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{riderName || "Rider"}</Text>
            <Text style={styles.headerSub}>Tap a reply or type below</Text>
          </View>
          <SpringPress style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color="#fff" />
          </SpringPress>
        </View>

        {/* Quick replies */}
        <View style={styles.quickSection}>
          <Text style={styles.quickLabel}>Quick replies</Text>
          <View style={styles.quickGrid}>
            {QUICK_REPLIES.map((q) => (
              <SpringPress
                key={q}
                style={styles.quickChip}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </SpringPress>
            ))}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textDim}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />
          <SpringPress
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color={input.trim() ? "#fff" : colors.textDim}
            />
          </SpringPress>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 12,
    backgroundColor: colors.accentDark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: font.subtitle, fontWeight: "600" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: font.caption, marginTop: 2 },
  callBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  quickSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  quickLabel: {
    color: colors.textMuted, fontSize: font.caption, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  quickChipText: { color: colors.text, fontSize: font.small, fontWeight: "500" },

  msgBubble: {
    maxWidth: "78%",
    padding: 12,
    borderRadius: radius.lg,
    marginBottom: 8,
  },
  msgSent: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  msgReceived: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  msgText: { color: colors.text, fontSize: font.label, lineHeight: 20 },
  msgTextSent: { color: "#fff" },
  msgTime: {
    color: colors.textDim, fontSize: font.micro, marginTop: 4, alignSelf: "flex-end",
  },
  msgTimeSent: { color: "rgba(255,255,255,0.7)" },

  inputBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, color: colors.text, fontSize: font.label,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceAlt },
});
