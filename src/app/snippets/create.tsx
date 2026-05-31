import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { saveAttachment } from "../../core/filesystem/fileManager";
import { insertAttachmentRecord } from "../../features/files/repository";
import { useSettingsStore } from "../../features/settings/store";
import { useSnippetStore } from "../../features/snippets/store";
import { useImagePicker } from "../../shared/hooks/useImagePicker";
import { Colors } from "../../shared/theme/colors";

export default function CreateSnippetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = Colors[useSettingsStore().theme];
  const addSnippet = useSnippetStore((state) => state.addSnippet);
  const { pickImage } = useImagePicker();

  const [form, setForm] = useState({
    title: "",
    language: "",
    content: "",
    attachments: [] as string[],
  });

  const [currentTag, setCurrentTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleAttachImage = async () => {
    const uri = await pickImage();
    if (uri) {
      setForm((prev) => ({ ...prev, attachments: [...prev.attachments, uri] }));
    }
  };

  const handleAddTag = () => {
    const trimmed = currentTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert("Validation Error", "Title is required.");
      return;
    }
    if (!form.content.trim()) {
      Alert.alert("Validation Error", "Snippet content cannot be empty.");
      return;
    }
    if (!form.language.trim()) {
      Alert.alert("Validation Error", "Please specify a language.");
      return;
    }

    try {
      const newId = Crypto.randomUUID();

      addSnippet({
        id: newId,
        title: form.title.trim(),
        language: form.language.trim(),
        content: form.content,
        tags: JSON.stringify(tags),
      });

      for (const tempUri of form.attachments) {
        const attachmentId = Crypto.randomUUID();
        const extension = tempUri.split(".").pop() || "jpg";
        const uniqueFileName = `${newId}_${attachmentId}.${extension}`;

        const permanentUri = await saveAttachment(tempUri, uniqueFileName);

        insertAttachmentRecord({
          id: attachmentId,
          snippet_id: newId,
          file_name: uniqueFileName,
          file_uri: permanentUri,
        });
      }

      router.back();
    } catch (error) {
      console.error("Error saving the snippet:", error);
      Alert.alert("Error", "Failed to save the snippet.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background, paddingTop: insets.top + 16 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={[styles.cancelText, { color: theme.textMuted }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          New Snippet
        </Text>

        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={[styles.titleInput, { color: theme.text }]}
          placeholder="Snippet Title..."
          placeholderTextColor={theme.textMuted}
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          autoFocus
        />

        <View style={styles.metaRow}>
          <View
            style={[
              styles.metaInputContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Feather name="code" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.metaInput, { color: theme.text }]}
              placeholder="Language (e.g. React)"
              placeholderTextColor={theme.textMuted}
              value={form.language}
              onChangeText={(text) => setForm({ ...form, language: text })}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View
          style={[
            styles.tagInputContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Feather name="hash" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.tagInput, { color: theme.text }]}
            placeholder="Add tags..."
            placeholderTextColor={theme.textMuted}
            value={currentTag}
            onChangeText={setCurrentTag}
            onSubmitEditing={handleAddTag}
            blurOnSubmit={false}
            autoCapitalize="none"
            returnKeyType="done"
          />
          {currentTag.length > 0 && (
            <TouchableOpacity onPress={handleAddTag} style={styles.addTagBtn}>
              <Feather name="plus" size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsWrapper}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagBadge,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => removeTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, { color: theme.text }]}>
                  {tag}
                </Text>
                <Feather
                  name="x"
                  size={14}
                  color={theme.textMuted}
                  style={styles.tagRemoveIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View
          style={[
            styles.editorContainer,
            {
              backgroundColor: theme.codeBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[styles.editorHeader, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.editorLabel, { color: theme.textMuted }]}>
              CODE
            </Text>
            <TouchableOpacity
              onPress={handleAttachImage}
              style={styles.attachMiniBtn}
            >
              <Feather name="image" size={16} color={theme.primary} />
              <Text style={[styles.attachMiniText, { color: theme.primary }]}>
                Attach
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.codeEditor, { color: theme.text }]}
            placeholder="// Paste your flawless logic here..."
            placeholderTextColor={theme.textMuted}
            value={form.content}
            onChangeText={(text) => setForm({ ...form, content: text })}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>

        {form.attachments.length > 0 && (
          <View style={styles.previewGrid}>
            {form.attachments.map((uri, index) => (
              <View
                key={`${uri}-${index}`}
                style={[
                  styles.previewImageContainer,
                  { borderColor: theme.border },
                ]}
              >
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={[
                    styles.removeImageBtn,
                    { backgroundColor: theme.danger },
                  ]}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      attachments: prev.attachments.filter(
                        (_, i) => i !== index,
                      ),
                    }))
                  }
                >
                  <Feather name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerButton: {
    paddingVertical: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 24,
  },
  metaRow: {
    marginBottom: 16,
  },
  metaInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  metaInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  tagInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  addTagBtn: {
    padding: 4,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagRemoveIcon: {
    marginLeft: 8,
  },
  editorContainer: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  editorLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  attachMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  attachMiniText: {
    fontSize: 13,
    fontWeight: "700",
  },
  codeEditor: {
    padding: 20,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 250,
    lineHeight: 24,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
  },
  previewImageContainer: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 12,
    marginRight: 16,
    marginBottom: 16,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 11,
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
});
