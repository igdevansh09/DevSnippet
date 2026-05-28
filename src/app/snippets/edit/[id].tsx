import { useState, useEffect } from "react";
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
import { useSnippetStore } from "../../../../src/features/snippets/store";
import { useSettingsStore } from "../../../../src/features/settings/store";
import { Colors } from "../../../../src/shared/theme/colors";

export default function EditSnippetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
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
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: theme.textMuted }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Edit Snippet
        </Text>
        <TouchableOpacity onPress={handleUpdate}>
          <Text style={[styles.saveText, { color: theme.primary }]}>
            Update
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: theme.text }]}>Title</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Snippet Title"
          placeholderTextColor={theme.textMuted}
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />

        <Text style={[styles.label, { color: theme.text }]}>Language</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Programming Language"
          placeholderTextColor={theme.textMuted}
          value={form.language}
          onChangeText={(text) => setForm({ ...form, language: text })}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: theme.text }]}>Tags</Text>
        <View
          style={[
            styles.tagInputContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[styles.tagInput, { color: theme.text }]}
            placeholder="Add a tag..."
            placeholderTextColor={theme.textMuted}
            value={currentTag}
            onChangeText={setCurrentTag}
            onSubmitEditing={handleAddTag}
            blurOnSubmit={false}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={handleAddTag} style={styles.addTagBtn}>
            <Feather name="plus-circle" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsWrapper}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagBadge,
                  { backgroundColor: theme.primaryMuted },
                ]}
                onPress={() => removeTag(tag)}
              >
                <Text style={[styles.tagText, { color: theme.primary }]}>
                  {tag}
                </Text>
                <Feather
                  name="x"
                  size={14}
                  color={theme.primary}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>
          Code Content
        </Text>
        <TextInput
          style={[
            styles.codeEditor,
            {
              backgroundColor: theme.codeBackground,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={form.content}
          onChangeText={(text) => setForm({ ...form, content: text })}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  cancelText: { fontSize: 16 },
  saveText: { fontSize: 16, fontWeight: "600" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16 },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 12,
  },
  tagInput: { flex: 1, padding: 14, fontSize: 16 },
  addTagBtn: { padding: 4 },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: { fontSize: 14, fontWeight: "500" },
  codeEditor: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 300,
  },
});
