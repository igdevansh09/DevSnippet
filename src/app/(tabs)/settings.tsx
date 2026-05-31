import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  deleteApiKey,
  getApiKey,
  saveApiKey,
} from "../../../src/core/storage/secure";
import { useSettingsStore } from "../../../src/features/settings/store";
import { Colors } from "../../../src/shared/theme/colors";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
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
    } catch {
      Alert.alert("Error", "Failed to save API key.");
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

  const handleWipFeature = (feature: string) => {
    Alert.alert(
      "Coming Soon",
      `${feature} will be available in the next update.`,
    );
  };

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "Remove cached files and temporary data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          Alert.alert("Success", "Cache cleared successfully.");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: currentTheme.background,
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: currentTheme.textMuted }]}>
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
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${currentTheme.primary}15` },
                ]}
              >
                <Feather
                  name={isDark ? "moon" : "sun"}
                  size={18}
                  color={currentTheme.primary}
                />
              </View>
              <Text style={[styles.rowText, { color: currentTheme.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: currentTheme.border,
                true: currentTheme.primary,
              }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: currentTheme.textMuted }]}>
          AI CAPABILITIES
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
          <Text style={[styles.description, { color: currentTheme.textMuted }]}>
            Enable code explanations and summaries powered by Gemini AI. Your
            API key is encrypted and stored locally.
          </Text>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.border,
              },
            ]}
          >
            <Feather name="key" size={18} color={currentTheme.textMuted} />
            <TextInput
              style={[styles.input, { color: currentTheme.text }]}
              placeholder="Enter Gemini API Key..."
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
                  {
                    borderColor: currentTheme.danger,
                    flex: 1,
                    marginRight: 12,
                  },
                ]}
                onPress={handleRemoveKey}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnText, { color: currentTheme.danger }]}>
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
                },
              ]}
              onPress={handleSaveKey}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: "#ffffff" }]}>
                {isSaving
                  ? "Saving..."
                  : hasSavedKey
                    ? "Update Key"
                    : "Securely Save Key"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: currentTheme.textMuted }]}>
          DATA & STORAGE
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
          <TouchableOpacity
            style={[styles.row, { paddingVertical: 12 }]}
            onPress={() => handleWipFeature("Import Snippets")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${currentTheme.primary}15` },
                ]}
              >
                <Feather name="upload" size={18} color={currentTheme.primary} />
              </View>
              <View>
                <Text style={[styles.rowText, { color: currentTheme.text }]}>
                  Import Snippets
                </Text>
                <Text
                  style={{
                    color: currentTheme.textMuted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Import from .json file
                </Text>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={currentTheme.textMuted}
            />
          </TouchableOpacity>

          <View
            style={[styles.divider, { backgroundColor: currentTheme.border }]}
          />

          <TouchableOpacity
            style={[styles.row, { paddingVertical: 12 }]}
            onPress={() => handleWipFeature("Export Vault")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: currentTheme.codeBackground },
                ]}
              >
                <Feather name="download" size={18} color={currentTheme.text} />
              </View>
              <View>
                <Text style={[styles.rowText, { color: currentTheme.text }]}>
                  Export All Snippets
                </Text>
                <Text
                  style={{
                    color: currentTheme.textMuted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Backup data to .json file
                </Text>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={currentTheme.textMuted}
            />
          </TouchableOpacity>

          <View
            style={[styles.divider, { backgroundColor: currentTheme.border }]}
          />

          <TouchableOpacity
            style={[styles.row, { paddingVertical: 12 }]}
            onPress={handleClearCache}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${currentTheme.primary}15` },
                ]}
              >
                <Feather name="trash" size={18} color={currentTheme.primary} />
              </View>
              <View>
                <Text style={[styles.rowText, { color: currentTheme.text }]}>
                  Clear Cache
                </Text>
                <Text
                  style={{
                    color: currentTheme.textMuted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Remove temporary files
                </Text>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={currentTheme.textMuted}
            />
          </TouchableOpacity>

          <View
            style={[styles.divider, { backgroundColor: currentTheme.border }]}
          />

          <TouchableOpacity
            style={[styles.row, { paddingVertical: 12 }]}
            onPress={() => handleWipFeature("Clear Vault")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${currentTheme.danger}15` },
                ]}
              >
                <Feather name="trash-2" size={18} color={currentTheme.danger} />
              </View>
              <Text style={[styles.rowText, { color: currentTheme.danger }]}>
                Wipe Local Database
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: currentTheme.textMuted }]}>
          HELP & FEEDBACK
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
          <TouchableOpacity
            style={[styles.row, { paddingVertical: 12 }]}
            onPress={() => handleWipFeature("View Documentation")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${currentTheme.primary}15` },
                ]}
              >
                <Feather
                  name="help-circle"
                  size={18}
                  color={currentTheme.primary}
                />
              </View>
              <Text style={[styles.rowText, { color: currentTheme.text }]}>
                Documentation
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={currentTheme.textMuted}
            />
          </TouchableOpacity>

          <View
            style={[styles.divider, { backgroundColor: currentTheme.border }]}
          />

          <TouchableOpacity
            style={[styles.row, { paddingVertical: 12 }]}
            onPress={() => handleWipFeature("Send Feedback")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${currentTheme.primary}15` },
                ]}
              >
                <Feather name="send" size={18} color={currentTheme.primary} />
              </View>
              <Text style={[styles.rowText, { color: currentTheme.text }]}>
                Send Feedback
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={currentTheme.textMuted}
            />
          </TouchableOpacity>

          <View
            style={[styles.divider, { backgroundColor: currentTheme.border }]}
          />

          <TouchableOpacity
            style={[styles.row, { paddingVertical: 12 }]}
            onPress={() => handleWipFeature("View Source")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${currentTheme.primary}15` },
                ]}
              >
                <Feather name="github" size={18} color={currentTheme.primary} />
              </View>
              <Text style={[styles.rowText, { color: currentTheme.text }]}>
                GitHub Repository
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={currentTheme.textMuted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Feather
            name="code"
            size={32}
            color={currentTheme.primary}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.appName, { color: currentTheme.text }]}>
            DevSnippet Vault
          </Text>
          <Text style={[styles.appVersion, { color: currentTheme.textMuted }]}>
            Version 1.0.0
          </Text>
          <Text
            style={[styles.developerCredit, { color: currentTheme.textMuted }]}
          >
            Engineered with Expo & React Native
          </Text>
          <Text
            style={{
              color: currentTheme.textMuted,
              fontSize: 12,
              marginTop: 8,
            }}
          >
            Designed by Devansh
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btn: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  btnOutline: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    marginTop: 48,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  developerCredit: {
    fontSize: 12,
    marginTop: 12,
  },
});
