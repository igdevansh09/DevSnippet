import { Feather } from "@expo/vector-icons";
import { File } from "expo-file-system";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createResourceFolder,
  deleteResource,
  downloadTemplate,
  getDirectoryContents,
  moveResource,
  resourcesDirectory,
} from "../../../src/core/filesystem/fileManager";
import { useSettingsStore } from "../../../src/features/settings/store";
import { Colors } from "../../../src/shared/theme/colors";
import { formatToAppDate } from "../../../src/shared/utils/date";

export default function FileManagerScreen() {
  const theme = Colors[useSettingsStore().theme];

  const [currentPath, setCurrentPath] = useState(resourcesDirectory.uri);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [resourceItems, setResourceItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"folder" | "download" | "move">(
    "folder",
  );
  const [inputValue, setInputValue] = useState("");
  const [secondaryInput, setSecondaryInput] = useState("");
  const [selectedItemUri, setSelectedItemUri] = useState<string | null>(null);

  const [filePreview, setFilePreview] = useState<{
    name: string;
    content: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadResources(currentPath);
    }, [currentPath]),
  );

  const loadResources = async (uri: string) => {
    setIsLoading(true);
    try {
      const items = await getDirectoryContents(uri);
      setResourceItems(items);
    } catch (error) {
      Alert.alert("Error", "Could not read directory.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateUp = () => {
    if (pathHistory.length > 0) {
      const newHistory = [...pathHistory];
      const previousPath = newHistory.pop()!;
      setPathHistory(newHistory);
      setCurrentPath(previousPath);
    }
  };

  const handleResourceTap = async (item: any) => {
    if (item.isDirectory) {
      setPathHistory([...pathHistory, currentPath]);
      setCurrentPath(item.uri);
    } else {
      try {
        const content = await new File(item.uri).text();
        setFilePreview({ name: item.name, content });
      } catch (error) {
        Alert.alert(
          "Read Error",
          "Cannot display this file format. It may be a binary or corrupted file.",
        );
        console.error(error);
      }
    }
  };

  const handleOpenOptions = (item: any) => {
    Alert.alert(`Options: ${item.name}`, "Select an action", [
      {
        text: "Move",
        onPress: () => {
          setSelectedItemUri(item.uri);
          setModalType("move");
          setModalVisible(true);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteResource(item.uri),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDeleteResource = async (uri: string) => {
    try {
      await deleteResource(uri);
      loadResources(currentPath);
    } catch (error) {
      Alert.alert("Error", "Could not delete file.");
      console.error(error);
    }
  };

  const submitModal = async () => {
    setModalVisible(false);
    try {
      if (modalType === "folder" && inputValue.trim()) {
        await createResourceFolder(currentPath, inputValue.trim());
      } else if (
        modalType === "download" &&
        inputValue.trim() &&
        secondaryInput.trim()
      ) {
        setIsLoading(true);
        await downloadTemplate(
          inputValue.trim(),
          currentPath,
          secondaryInput.trim(),
        );
      } else if (modalType === "move" && selectedItemUri && inputValue.trim()) {
        const targetDir = `${currentPath}/${inputValue.trim()}`;
        const fileName = selectedItemUri.split("/").pop()!;
        await moveResource(selectedItemUri, targetDir, fileName);
      }
    } catch (error) {
      Alert.alert(
        "Action Failed",
        "Please verify your input and target directories exist.",
      );
      console.error(error);
    } finally {
      setInputValue("");
      setSecondaryInput("");
      setSelectedItemUri(null);
      loadResources(currentPath);
    }
  };

  const renderResource = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => handleResourceTap(item)}
      activeOpacity={0.7}
    >
      <Feather
        name={item.isDirectory ? "folder" : "file-text"}
        size={32}
        color={item.isDirectory ? theme.primary : theme.textMuted}
        style={styles.thumbnailPlaceholder}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {!item.isDirectory && (
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {(item.size / 1024).toFixed(1)} KB
          </Text>
        )}
        {item.modificationTime && (
          <Text style={[styles.date, { color: theme.textMuted }]}>
            {formatToAppDate(item.modificationTime * 1000)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.optionsBtn}
        onPress={() => handleOpenOptions(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="more-vertical" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Resource Explorer
        </Text>
      </View>

      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={navigateUp}
          disabled={pathHistory.length === 0}
        >
          <Feather
            name="corner-left-up"
            size={24}
            color={pathHistory.length === 0 ? theme.border : theme.text}
          />
        </TouchableOpacity>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            onPress={() => {
              setModalType("folder");
              setModalVisible(true);
            }}
            style={[
              styles.toolbarBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Feather name="folder-plus" size={16} color={theme.text} />
            <Text style={{ color: theme.text, marginLeft: 6, fontSize: 13 }}>
              New Folder
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setModalType("download");
              setModalVisible(true);
            }}
            style={[
              styles.toolbarBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                marginLeft: 8,
              },
            ]}
          >
            <Feather name="download-cloud" size={16} color={theme.text} />
            <Text style={{ color: theme.text, marginLeft: 6, fontSize: 13 }}>
              Fetch File
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={resourceItems}
          keyExtractor={(item) => item.uri}
          renderItem={renderResource}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Feather
                name="inbox"
                size={48}
                color={theme.border}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Directory Empty
              </Text>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {modalType === "folder"
                ? "Create Folder"
                : modalType === "download"
                  ? "Download Template"
                  : "Move to Folder"}
            </Text>

            {modalType === "download" && (
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    marginBottom: 12,
                  },
                ]}
                placeholder="Enter raw URL (https://...)"
                placeholderTextColor={theme.textMuted}
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="none"
              />
            )}

            <TextInput
              style={[
                styles.modalInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholder={
                modalType === "folder"
                  ? "Folder Name"
                  : modalType === "download"
                    ? "Save As (e.g., template.js)"
                    : "Target Folder Name"
              }
              placeholderTextColor={theme.textMuted}
              value={modalType === "download" ? secondaryInput : inputValue}
              onChangeText={
                modalType === "download" ? setSecondaryInput : setInputValue
              }
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setInputValue("");
                  setSecondaryInput("");
                }}
                style={{ padding: 12 }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 16 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitModal}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!filePreview} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View
            style={[styles.viewerHeader, { borderBottomColor: theme.border }]}
          >
            <Text
              style={[styles.viewerTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {filePreview?.name}
            </Text>
            <TouchableOpacity
              onPress={() => setFilePreview(null)}
              style={{ padding: 8 }}
            >
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.viewerScroll}>
            <Text style={[styles.viewerText, { color: theme.text }]}>
              {filePreview?.content}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 60, borderBottomWidth: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  toolbarActions: { flexDirection: "row" },
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnailPlaceholder: { width: 50, textAlign: "center", marginRight: 12 },
  info: { flex: 1, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  date: { fontSize: 12 },
  optionsBtn: { padding: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },

  // Input Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 15 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    alignItems: "center",
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 16,
  },

  // Viewer Modal Styles
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  viewerTitle: { fontSize: 18, fontWeight: "600", flex: 1, marginRight: 16 },
  viewerScroll: { flex: 1, padding: 16 },
  viewerText: { fontFamily: "monospace", fontSize: 13, lineHeight: 20 },
});
