import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { Colors } from "../../../shared/theme/colors";
import { useSettingsStore } from "../../settings/store";
import { Snippet } from "../types";
import { formatToAppDate } from "@/shared/utils/date";

interface Props {
  snippet: Snippet;
}

export const SnippetCard = ({ snippet }: Props) => {
  const router = useRouter();
  const theme = Colors[useSettingsStore().theme];

  const tags: string[] = snippet.tags ? JSON.parse(snippet.tags) : [];

  const codePreview = snippet.content
    ? snippet.content.trim().split("\n").slice(0, 3).join("\n")
    : "// No code provided";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => router.push(`/snippets/${snippet.id}`)}
      activeOpacity={0.7}
    >
      {/* Top Meta Row */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {snippet.title}
          </Text>
        </View>

        {/* Actions/Icons */}
        <View style={styles.actionRow}>
          {snippet.is_favorite === 1 && (
            <Feather
              name="star"
              size={16}
              color={theme.primary}
            />
          )}
          <Feather name="arrow-up-right" size={18} color={theme.textMuted} />
        </View>
      </View>

      {/* The Premium Feature: Code Preview Box */}
      <View
        style={[
          styles.codePreviewContainer,
          { backgroundColor: theme.codeBackground, borderColor: theme.border },
        ]}
      >
        <Text
          style={[styles.codePreviewText, { color: theme.textMuted }]}
          numberOfLines={3}
        >
          {codePreview}
        </Text>
      </View>

      {/* Footer Meta */}
      <View style={styles.footer}>
        <View style={styles.tagContainer}>
          <Text style={[styles.languageText, { color: theme.primary }]}>
            {snippet.language}
          </Text>

          {tags.length > 0 && (
            <View
              style={[styles.dotDivider, { backgroundColor: theme.border }]}
            />
          )}

          {/* Render inline text tags instead of heavy boxes to keep the card elegant */}
          {tags.slice(0, 2).map((tag, i) => (
            <Text key={i} style={[styles.tagText, { color: theme.textMuted }]}>
              #{tag}
            </Text>
          ))}
          {tags.length > 2 && (
            <Text style={[styles.tagText, { color: theme.textMuted }]}>
              +{tags.length - 2}
            </Text>
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
  card: {
    borderWidth: 1,
    borderRadius: 20, // Softer, more modern border radius
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  codePreviewContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  codePreviewText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
    paddingRight: 12,
  },
  languageText: {
    fontSize: 13,
    fontWeight: "800",
  },
  dotDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
