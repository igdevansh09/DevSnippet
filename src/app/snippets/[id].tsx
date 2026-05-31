import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ApiKeyError,
  generateSnippetExplanation,
  OfflineError,
} from "../../../src/core/ai/client";
import { getApiKey } from "../../../src/core/storage/secure";
import {
  Attachment,
  deleteSingleAttachment,
  getAttachmentsForSnippet,
  updateAttachmentRecord,
} from "../../../src/features/files/repository";
import { useSettingsStore } from "../../../src/features/settings/store";
import { useSnippetStore } from "../../../src/features/snippets/store";
import { useImagePicker } from "../../../src/shared/hooks/useImagePicker";
import { Colors } from "../../../src/shared/theme/colors";
import { generateExportFile } from "../../../src/shared/utils/export";
import { shareFile } from "../../../src/shared/utils/share";
import { formatToAppDate } from "@/shared/utils/date";

export default function SnippetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = Colors[useSettingsStore().theme];

  const snippets = useSnippetStore((state) => state.snippets);
  const removeSnippet = useSnippetStore((state) => state.removeSnippet);
  const toggleFavorite = useSnippetStore((state) => state.toggleFavorite);

  const snippet = snippets.find((s) => s.id === id);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { pickImage } = useImagePicker();
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);

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
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
          Snippet not found.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: theme.primary, fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tags = snippet.tags ? JSON.parse(snippet.tags) : [];

  const exportOptions = [
    { label: "Export as .js", format: "js" as const },
    { label: "Export as .json", format: "json" as const },
    { label: "Export as .txt", format: "txt" as const },
    { label: "Export as .cpp", format: "cpp" as const },
    { label: "Export as .java", format: "java" as const },
  ];

  const handleExport = () => {
    if (Platform.OS === "ios") {
      const options = [
        "Cancel",
        ...exportOptions.map((option) => option.label),
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0 },
        async (buttonIndex) => {
          if (buttonIndex > 0) {
            executeExport(exportOptions[buttonIndex - 1].format);
          }
        },
      );
    } else {
      setExportModalVisible(true);
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

  const handleReplaceImage = async () => {
    if (!selectedImage) return;

    const newUri = await pickImage();
    if (newUri) {
      try {
        await updateAttachmentRecord(
          selectedImage.id,
          selectedImage.file_name,
          newUri,
          snippet.id,
        );
        setSelectedImage(null);
        setAttachments(getAttachmentsForSnippet(snippet.id));
      } catch (e) {
        Alert.alert("Error", "Failed to replace image.");
        console.error("Error replacing image:", e);
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedImage) return;

    Alert.alert("Delete Image", "Remove this attachment permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSingleAttachment(
            selectedImage.id,
            selectedImage.file_name,
          );
          setSelectedImage(null);
          setAttachments(getAttachmentsForSnippet(snippet.id));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background, paddingTop: insets.top + 16 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push(`/snippets/edit/${snippet.id}`)}
            style={styles.iconBtn}
          >
            <Feather name="edit-2" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleFavorite(snippet.id)}
            style={styles.iconBtn}
          >
            <Feather
              name="star"
              size={20}
              color={snippet.is_favorite === 1 ? theme.primary : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.iconBtn}>
            <Feather name="share" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
            <Feather name="trash-2" size={20} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {snippet.title}
        </Text>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.languageBadge,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.languageIndicator,
                { backgroundColor: theme.primary },
              ]}
            />
            <Text style={[styles.languageText, { color: theme.text }]}>
              {snippet.language}
            </Text>
          </View>
          <Text style={[styles.date, { color: theme.textMuted }]}>
            {formatToAppDate(snippet.created_at) || snippet.created_at}
          </Text>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag: string) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.tagText, { color: theme.textMuted }]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              ATTACHMENTS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attachmentScroll}
            >
              {attachments.map((att) => (
                <TouchableOpacity
                  key={att.id}
                  onPress={() => setSelectedImage(att)}
                >
                  <Image
                    source={{ uri: att.file_uri }}
                    style={[
                      styles.attachmentImage,
                      { borderColor: theme.border },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Modal visible={!!selectedImage} transparent animationType="fade">
              <SafeAreaView
                style={[
                  styles.modalContainer,
                  { backgroundColor: "rgba(0,0,0,0.95)" },
                ]}
              >
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setSelectedImage(null)}
                    style={styles.modalIconBtn}
                  >
                    <Feather name="x" size={28} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      onPress={handleReplaceImage}
                      style={styles.modalIconBtn}
                    >
                      <Feather name="edit-3" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDeleteImage}
                      style={styles.modalIconBtn}
                    >
                      <Feather name="trash-2" size={24} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage.file_uri }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                )}
              </SafeAreaView>
            </Modal>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            CODE
          </Text>
          <View
            style={[
              styles.codeWrapper,
              {
                backgroundColor: theme.codeBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.codeInnerPadding}>
                <Markdown
                  style={{
                    body: { color: theme.text, margin: 0, padding: 0 },
                    fence: {
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                      fontSize: 14,
                      lineHeight: 22,
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
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
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
              <Text style={[styles.aiButtonText, { color: theme.text }]}>
                Explain Code
              </Text>
            </TouchableOpacity>
          )}

          {isGenerating && (
            <View
              style={[
                styles.aiStateCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.aiStateText, { color: theme.textMuted }]}>
                Analyzing logic...
              </Text>
            </View>
          )}

          {aiError && (
            <View
              style={[
                styles.aiStateCard,
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
                <Text style={{ color: theme.text, fontWeight: "700" }}>
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
                  body: { color: theme.text, fontSize: 15, lineHeight: 24 },
                  code_block: {
                    backgroundColor: theme.codeBackground,
                    borderRadius: 8,
                    padding: 12,
                  },
                  heading3: {
                    marginTop: 16,
                    marginBottom: 8,
                    fontWeight: "700",
                  },
                }}
              >
                {explanation}
              </Markdown>
            </View>
          )}
        </View>

        <Modal visible={exportModalVisible} transparent animationType="fade">
          <SafeAreaView
            style={[
              styles.exportModalOverlay,
              { backgroundColor: "rgba(0,0,0,0.6)" },
            ]}
          >
            <View
              style={[
                styles.exportModalCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.exportModalTitle, { color: theme.text }]}>
                Select Format
              </Text>
              {exportOptions.map((option) => (
                <TouchableOpacity
                  key={option.format}
                  onPress={async () => {
                    setExportModalVisible(false);
                    await executeExport(option.format);
                  }}
                  style={[
                    styles.exportModalOption,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.exportModalOptionText,
                      { color: theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                style={styles.exportModalCancel}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRight: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8 },
  content: { padding: 24, paddingBottom: 60 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  languageBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  languageIndicator: { width: 8, height: 8, borderRadius: 4 },
  languageText: { fontWeight: "700", fontSize: 13 },
  date: { fontSize: 13, fontWeight: "500" },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: "600" },
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  attachmentScroll: { flexDirection: "row" },
  attachmentImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 16,
  },
  codeWrapper: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  codeInnerPadding: { padding: 20, minWidth: "100%" },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
  },
  aiButtonText: { fontSize: 15, fontWeight: "700" },
  aiStateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    gap: 16,
  },
  aiStateText: { fontSize: 15, fontWeight: "500" },
  aiErrorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  retryBtn: { padding: 8 },
  markdownWrapper: { padding: 20, borderWidth: 1, borderRadius: 16 },
  modalContainer: { flex: 1, justifyContent: "flex-start" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    zIndex: 10,
  },
  modalActions: { flexDirection: "row", gap: 8 },
  modalIconBtn: {
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
  },
  fullImage: { position: "absolute", width: "100%", height: "100%", zIndex: 1 },
  exportModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  exportModalCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
  },
  exportModalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  exportModalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  exportModalCancel: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 16,
  },
});
