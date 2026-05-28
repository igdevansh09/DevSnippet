import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

import {
  ApiKeyError,
  generateSnippetExplanation,
  OfflineError,
} from "../../../src/core/ai/client";
import { getApiKey } from "../../../src/core/storage/secure";
import {
  Attachment,
  getAttachmentsForSnippet,
} from "../../../src/features/files/repository";
import { useSettingsStore } from "../../../src/features/settings/store";
import { useSnippetStore } from "../../../src/features/snippets/store";
import { Colors } from "../../../src/shared/theme/colors";
import { formatToAppDate } from "../../../src/shared/utils/date";
import { generateExportFile } from "../../../src/shared/utils/export";
import { shareFile } from "../../../src/shared/utils/share";

export default function SnippetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = Colors[useSettingsStore().theme];

  const snippets = useSnippetStore((state) => state.snippets);
  const removeSnippet = useSnippetStore((state) => state.removeSnippet);
  const toggleFavorite = useSnippetStore((state) => state.toggleFavorite);

  const snippet = snippets.find((s) => s.id === id);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (snippet?.id) {
        const data = getAttachmentsForSnippet(snippet.id);
        setAttachments(data);
      }
    }, [snippet?.id]),
  );

  if (!snippet) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Snippet not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: theme.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tags = snippet.tags ? JSON.parse(snippet.tags) : [];

  const handleExport = () => {
    const options = [
      "Cancel",
      "Export as .js",
      "Export as .json",
      "Export as .txt",
      "Export as .cpp",
      "Export as .java",
    ];
    const formats: ("js" | "json" | "txt" | "cpp" | "java")[] = [
      "js",
      "json",
      "txt",
      "cpp",
      "java",
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0 },
        async (buttonIndex) => {
          if (buttonIndex > 0) {
            executeExport(formats[buttonIndex - 1]);
          }
        },
      );
    } else {
      Alert.alert("Select Format", "Choose an export format", [
        { text: ".js", onPress: () => executeExport("js") },
        { text: ".json", onPress: () => executeExport("json") },
        { text: ".txt", onPress: () => executeExport("txt") },
        { text: ".cpp", onPress: () => executeExport("cpp") },
        { text: ".java", onPress: () => executeExport("java") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const executeExport = async (
    format: "js" | "json" | "txt" | "cpp" | "java",
  ) => {
    try {
      const uri = await generateExportFile(snippet, format);
      await shareFile(uri);
    } catch (error) {
      Alert.alert("Export Failed", "Could not export the snippet.");
      console.error("Error exporting snippet:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Snippet", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeSnippet(snippet.id);
          router.back();
        },
      },
    ]);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiError(null);

    try {
      const apiKey = await getApiKey();
      const result = await generateSnippetExplanation(snippet.content, apiKey);
      setExplanation(result);
    } catch (error) {
      if (error instanceof ApiKeyError) {
        setAiError("API key missing. Please configure it in Settings.");
      } else if (error instanceof OfflineError) {
        setAiError("No internet connection. AI requires network access.");
      } else {
        setAiError(
          "Failed to generate explanation. Check your key and try again.",
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {/* THE NEW EDIT BUTTON */}
          <TouchableOpacity
            onPress={() => router.push(`/snippets/edit/${snippet.id}`)}
            style={styles.iconBtn}
          >
            <Feather name="edit-2" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleFavorite(snippet.id)}
            style={styles.iconBtn}
          >
            <Feather
              name="star"
              size={20}
              color={snippet.is_favorite === 1 ? "#e3b341" : theme.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.iconBtn}>
            <Feather name="share" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
            <Feather name="trash-2" size={20} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {snippet.title}
        </Text>

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.languageBadge,
              { color: theme.primary, backgroundColor: theme.primaryMuted },
            ]}
          >
            {snippet.language}
          </Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>
            Created: {formatToAppDate(snippet.created_at)}
          </Text>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag: string) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: theme.codeBackground }]}
              >
                <Text style={[styles.tagText, { color: theme.textMuted }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {attachments.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              ATTACHMENTS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attachmentScroll}
            >
              {attachments.map((att) => (
                <Image
                  key={att.id}
                  source={{ uri: att.file_uri }}
                  style={[
                    styles.attachmentImage,
                    { borderColor: theme.border },
                  ]}
                />
              ))}
            </ScrollView>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
          CODE
        </Text>
        <View
          style={[
            styles.codeWrapper,
            {
              borderColor: theme.border,
              backgroundColor: theme.codeBackground,
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ padding: 16, minWidth: "100%" }}>
              <Markdown
                style={{
                  body: { color: theme.text, margin: 0, padding: 0 },
                  fence: {
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 14,
                    color: theme.text,
                    backgroundColor: "transparent",
                    borderWidth: 0,
                    margin: 0,
                    padding: 0,
                  },
                }}
              >
                {`\`\`\`${snippet.language.toLowerCase()}\n${snippet.content}\n\`\`\``}
              </Markdown>
            </View>
          </ScrollView>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: theme.textMuted, marginTop: 24 },
          ]}
        >
          AI ANALYSIS
        </Text>

        {!explanation && !isGenerating && !aiError && (
          <TouchableOpacity
            style={[
              styles.aiButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleGenerateAI}
          >
            <Feather name="cpu" size={20} color={theme.primary} />
            <Text style={[styles.aiButtonText, { color: theme.primary }]}>
              Generate Explanation
            </Text>
          </TouchableOpacity>
        )}

        {isGenerating && (
          <View
            style={[
              styles.aiLoading,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.aiLoadingText, { color: theme.textMuted }]}>
              Analyzing code...
            </Text>
          </View>
        )}

        {aiError && (
          <View
            style={[
              styles.aiError,
              { backgroundColor: theme.surface, borderColor: theme.danger },
            ]}
          >
            <Feather name="alert-circle" size={20} color={theme.danger} />
            <Text style={[styles.aiErrorText, { color: theme.danger }]}>
              {aiError}
            </Text>
            <TouchableOpacity
              onPress={handleGenerateAI}
              style={styles.retryBtn}
            >
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {explanation && (
          <View
            style={[
              styles.markdownWrapper,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Markdown
              style={{
                body: { color: theme.text },
                code_block: { backgroundColor: theme.codeBackground },
              }}
            >
              {explanation}
            </Markdown>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerRight: { flexDirection: "row", gap: 16 },
  iconBtn: { padding: 4 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  languageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: "600",
    fontSize: 13,
    overflow: "hidden",
  },
  date: { fontSize: 13 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  attachmentScroll: { marginBottom: 24 },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    backgroundColor: "#000",
  },
  codeWrapper: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  aiButtonText: { fontSize: 16, fontWeight: "600" },
  aiLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  aiLoadingText: { fontSize: 15 },
  aiError: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  aiErrorText: { flex: 1, fontSize: 14 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  markdownWrapper: { padding: 16, borderWidth: 1, borderRadius: 12 },
});
