import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSettingsStore } from "../../../src/features/settings/store";
import {
  saveApiKey,
  getApiKey,
  deleteApiKey,
} from "../../../src/core/storage/secure";
import { Colors } from "../../../src/shared/theme/colors";

export default function SettingsScreen() {
  const { theme, setTheme } = useSettingsStore();
  const currentTheme = Colors[theme];
  const isDark = theme === "dark";

  const [apiKey, setApiKey] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadKeyStatus = async () => {
      const key = await getApiKey();
      if (key) {
        setHasSavedKey(true);
        setApiKey("••••••••••••" + key.slice(-4));
      }
    };
    loadKeyStatus();
  }, []);

  const handleSaveKey = async () => {
    if (!apiKey.trim() || apiKey.startsWith("••••")) {
      Alert.alert("Invalid Key", "Please enter a valid Gemini API key.");
      return;
    }

    setIsSaving(true);
    try {
      await saveApiKey(apiKey.trim());
      setHasSavedKey(true);
      setApiKey("••••••••••••" + apiKey.trim().slice(-4));
      Alert.alert("Success", "API key securely saved to device keychain.");
    } catch (error) {
      Alert.alert("Error", "Failed to save API key.");
      console.error("Error saving API key:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    Alert.alert(
      "Remove API Key",
      "Are you sure? AI features will be disabled until you provide a new key.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteApiKey();
            setHasSavedKey(false);
            setApiKey("");
          },
        },
      ],
    );
  };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: currentTheme.background }]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: currentTheme.surface,
              borderBottomColor: currentTheme.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
            Settings
          </Text>
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.sectionTitle, { color: currentTheme.textMuted }]}
          >
            APPEARANCE
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border,
              },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather
                  name={isDark ? "moon" : "sun"}
                  size={20}
                  color={currentTheme.text}
                />
                <Text style={[styles.rowText, { color: currentTheme.text }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: currentTheme.primary }}
                thumbColor={"#f4f3f4"}
              />
            </View>
          </View>

          <Text
            style={[
              styles.sectionTitle,
              { color: currentTheme.textMuted, marginTop: 32 },
            ]}
          >
            AI INTEGRATION
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border,
              },
            ]}
          >
            <Text
              style={[styles.description, { color: currentTheme.textMuted }]}
            >
              Enter your Google Gemini API key to enable local code explanations
              and summaries. Your key is stored securely on your device and
              never leaves it.
            </Text>

            <View
              style={[
                styles.inputContainer,
                { borderColor: currentTheme.border },
              ]}
            >
              <Feather name="key" size={18} color={currentTheme.textMuted} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                placeholder="AIzaSy..."
                placeholderTextColor={currentTheme.textMuted}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry={!hasSavedKey} 
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => {
                  if (hasSavedKey) setApiKey("");
                }}
              />
            </View>

            <View style={styles.actionRow}>
              {hasSavedKey && (
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnOutline,
                    { borderColor: currentTheme.danger },
                  ]}
                  onPress={handleRemoveKey}
                >
                  <Text
                    style={[styles.btnText, { color: currentTheme.danger }]}
                  >
                    Remove Key
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.btn,
                  {
                    backgroundColor: currentTheme.primary,
                    flex: 1,
                    marginLeft: hasSavedKey ? 12 : 0,
                  },
                ]}
                onPress={handleSaveKey}
                disabled={isSaving}
              >
                <Text style={[styles.btnText, { color: "#ffffff" }]}>
                  {isSaving
                    ? "Saving..."
                    : hasSavedKey
                      ? "Update Key"
                      : "Save Key"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 60, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { fontSize: 16, fontWeight: "500" },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  btn: {
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  btnOutline: { borderWidth: 1, backgroundColor: "transparent" },
  btnText: { fontSize: 15, fontWeight: "600" },
});
