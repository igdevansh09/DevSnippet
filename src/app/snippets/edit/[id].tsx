import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSnippetStore } from "../../../../src/features/snippets/store";
import { useSettingsStore } from "../../../../src/features/settings/store";
import { Colors } from "../../../../src/shared/theme/colors";

export default function EditSnippetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = Colors[useSettingsStore().theme];

  const snippets = useSnippetStore((state) => state.snippets);
  const editSnippet = useSnippetStore((state) => state.editSnippet);
  const existingSnippet = snippets.find((s) => s.id === id);

  const [form, setForm] = useState({
    title: existingSnippet?.title || "",
    language: existingSnippet?.language || "",
    content: existingSnippet?.content || "",
  });

  const [currentTag, setCurrentTag] = useState("");
  const [tags, setTags] = useState<string[]>(
    existingSnippet?.tags ? JSON.parse(existingSnippet.tags) : [],
  );

  if (!existingSnippet) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
      >
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

  const handleUpdate = () => {
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
      editSnippet(existingSnippet.id, {
        id: existingSnippet.id,
        title: form.title.trim(),
        language: form.language.trim(),
        content: form.content,
        tags: JSON.stringify(tags),
      });

      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update the snippet.");
      console.error("Error updating the snippet:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Immersive Header - Matching CreateScreen */}
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
          Edit Snippet
        </Text>

        <TouchableOpacity onPress={handleUpdate} style={styles.headerButton}>
          <Text style={[styles.saveText, { color: theme.primary }]}>
            Update
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input - Oversized and prominent */}
        <TextInput
          style={[styles.titleInput, { color: theme.text }]}
          placeholder="Snippet Title..."
          placeholderTextColor={theme.textMuted}
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
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

        {/* Tags Section */}
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

        {/* Code Editor - Edge to edge feel */}
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
          </View>

          <TextInput
            style={[styles.codeEditor, { color: theme.text }]}
            value={form.content}
            onChangeText={(text) => setForm({ ...form, content: text })}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    gap: 10,
    marginTop: 16,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
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
  codeEditor: {
    padding: 20,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 250,
    lineHeight: 24,
  },
});
