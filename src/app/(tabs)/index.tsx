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
import { useSnippetStore } from "../../../src/features/snippets/store";
import { useSettingsStore } from "../../../src/features/settings/store";
import { SnippetCard } from "../../../src/features/snippets/components/SnippetCard";
import { useDebounce } from "../../../src/shared/hooks/useDebounce";
import { Colors } from "../../../src/shared/theme/colors";

export default function HomeScreen() {
  const router = useRouter();
  const theme = Colors[useSettingsStore().theme];

  const snippets = useSnippetStore((state) => state.snippets);
  const [searchText, setSearchText] = useState("");

  const debouncedSearch = useDebounce(searchText, 300);

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

        {isCompletelyEmpty && (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/snippets/create")}
          >
            <Text style={styles.emptyButtonText}>Create First Snippet</Text>
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
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Snippets
        </Text>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search title, language, or tags..."
            placeholderTextColor={theme.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Feather name="x-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredSnippets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SnippetCard snippet={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => router.push("/snippets/create")}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 60, borderBottomWidth: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    padding: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
