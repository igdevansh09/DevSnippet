import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "../../../src/features/settings/store";
import { SnippetCard } from "../../../src/features/snippets/components/SnippetCard";
import { useSnippetStore } from "../../../src/features/snippets/store";
import { useDebounce } from "../../../src/shared/hooks/useDebounce";
import { Colors } from "../../../src/shared/theme/colors";
import { formatToAppDate } from "@/shared/utils/date";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = Colors[useSettingsStore().theme];

  const snippets = useSnippetStore((state) => state.snippets);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  const favoriteCount = useMemo(
    () => snippets.filter((snippet) => snippet.is_favorite === 1).length,
    [snippets],
  );

  const languageCount = useMemo(
    () => new Set(snippets.map((snippet) => snippet.language)).size,
    [snippets],
  );

  const todaySnippetsCount = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const todayString = `${dd}-${mm}-${yyyy}`;

    return snippets.filter((snippet) => formatToAppDate(snippet.created_at) === todayString).length;
  }, [snippets]);

  const filteredSnippets = useMemo(() => {
    if (!debouncedSearch.trim()) return snippets;

    const query = debouncedSearch.toLowerCase();
    return snippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(query) ||
        snippet.language.toLowerCase().includes(query) ||
        snippet.tags.toLowerCase().includes(query),
    );
  }, [snippets, debouncedSearch]);

  const renderEmptyState = () => {
    const isCompletelyEmpty = snippets.length === 0;

    return (
      <View style={styles.emptyContainer}>
        <Feather
          name={isCompletelyEmpty ? "database" : "search"}
          size={48}
          color={theme.border}
          style={{ marginBottom: 16 }}
        />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {isCompletelyEmpty ? "Your Vault is Empty" : "No Results Found"}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
          {isCompletelyEmpty
            ? "You haven't saved any code snippets yet."
            : `No matches for "${debouncedSearch}".`}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.metaBar, { paddingTop: insets.top + 16 }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandPill, { backgroundColor: theme.primary }]}>
            <Feather name="code" size={16} color="#ffffff" />
            <Text style={styles.brandText}>devSnippet</Text>
          </View>
          <View
            style={[
              styles.versionPill,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <Text style={[styles.versionText, { color: theme.text }]}>
              v1.0
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => router.push("/snippets/create")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredSnippets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SnippetCard snippet={item} />}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          <>
            <View style={styles.statsRow}>
              <View
                style={[styles.primaryCard, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.cardLabel}>Total snippets</Text>
                <Text style={styles.cardValue}>{snippets.length}</Text>
                {todaySnippetsCount > 0 && (
                  <Text style={styles.cardHint}>
                    +{todaySnippetsCount} today
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.summaryHeader}>
                  <Text style={[styles.cardLabel, { color: theme.textMuted }]}>
                    Favorited
                  </Text>
                  <Feather name="heart" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.cardValue, { color: theme.text }]}>
                  {favoriteCount}
                </Text>
                <Text style={[styles.cardHint, { color: theme.textMuted }]}>
                  {languageCount === 0
                    ? "No languages yet"
                    : `${languageCount} lang${languageCount > 1 ? "s" : ""}`}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent snippets
              </Text>
            </View>

            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Feather name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search title, lang, tag..."
                placeholderTextColor={theme.textMuted}
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchText("")}
                  style={{ padding: 4 }}
                >
                  <Feather name="x-circle" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  metaBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 12,
    gap: 6,
  },
  brandText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 16,
  },
  primaryCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
