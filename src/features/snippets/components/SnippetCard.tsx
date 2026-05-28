import { formatToAppDate } from "@/shared/utils/date";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../../shared/theme/colors";
import { useSettingsStore } from "../../settings/store";
import { Snippet } from "../types";

interface Props {
  snippet: Snippet;
}

export const SnippetCard = ({ snippet }: Props) => {
  const router = useRouter();
  const theme = Colors[useSettingsStore().theme];

  const tags: string[] = snippet.tags ? JSON.parse(snippet.tags) : [];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => router.push(`/snippets/${snippet.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {snippet.title}
        </Text>
        {snippet.is_favorite === 1 && <Text>⭐</Text>}
      </View>

      <Text style={[styles.language, { color: theme.primary }]}>
        {snippet.language}
      </Text>

      <View style={styles.footer}>
        <View style={styles.tagContainer}>
          {tags.slice(0, 3).map((tag, i) => (
            <View
              key={i}
              style={[styles.tag, { backgroundColor: theme.codeBackground }]}
            >
              <Text style={[styles.tagText, { color: theme.textMuted }]}>
                {tag}
              </Text>
            </View>
          ))}
          {tags.length > 3 && (
            <Text style={{ color: theme.textMuted }}>+{tags.length - 3}</Text>
          )}
        </View>

        <Text style={[styles.date, { color: theme.textMuted }]}>
          {formatToAppDate(snippet.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "600", flex: 1, marginRight: 8 },
  language: { fontSize: 14, fontWeight: "500", marginBottom: 12 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12 },
  date: { fontSize: 12 },
});
