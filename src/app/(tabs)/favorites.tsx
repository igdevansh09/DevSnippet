import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSnippetStore } from "../../../src/features/snippets/store";
import { useSettingsStore } from "../../../src/features/settings/store";
import { SnippetCard } from "../../../src/features/snippets/components/SnippetCard";
import { useDebounce } from "../../../src/shared/hooks/useDebounce";
import { Colors } from "../../../src/shared/theme/colors";

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = Colors[useSettingsStore().theme];
  const allSnippets = useSnippetStore((state) => state.snippets);

  const favoriteSnippets = useMemo(() => {
    return allSnippets.filter((snippet) => snippet.is_favorite === 1);
  }, [allSnippets]);

  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  const filteredFavorites = useMemo(() => {
    if (!debouncedSearch.trim()) return favoriteSnippets;

    const query = debouncedSearch.toLowerCase();
    return favoriteSnippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(query) ||
        snippet.language.toLowerCase().includes(query),
    );
  }, [favoriteSnippets, debouncedSearch]);

  const renderEmptyState = () => {
    const hasNoFavoritesAtAll = favoriteSnippets.length === 0;

    return (
      <View style={styles.emptyContainer}>
        <Feather
          name={hasNoFavoritesAtAll ? "star" : "search"}
          size={48}
          color={theme.border}
          style={{ marginBottom: 16 }}
        />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {hasNoFavoritesAtAll ? "No Saved Snippets" : "No Results Found"}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
          {hasNoFavoritesAtAll
            ? "Tap the star icon on any snippet to save it here for quick access."
            : `No saved snippets match "${debouncedSearch}".`}
        </Text>

        {hasNoFavoritesAtAll && (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Browse Library</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Saved</Text>

        {favoriteSnippets.length > 0 && (
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Feather name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search saved snippets..."
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
        )}
      </View>

      <FlatList
        data={filteredFavorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SnippetCard snippet={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32, // Matched to Dashboard scale
    fontWeight: "800",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16, // Matched to Dashboard standard
    paddingHorizontal: 16,
    height: 52, // Matched to Dashboard standard
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 120, // Accommodate standard bottom tab bar
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
