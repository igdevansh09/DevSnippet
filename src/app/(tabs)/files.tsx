import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createResourceFolder,
  deleteResource,
  downloadTemplate,
  getDirectoryContents,
  moveResource,
  resourcesDirectory,
} from "../../../src/core/filesystem/fileManager";
import {
  AttachmentWithSnippetInfo,
  deleteSingleAttachment,
  getAllAttachments,
} from "../../../src/features/files/repository";
import { useSettingsStore } from "../../../src/features/settings/store";
import { Colors } from "../../../src/shared/theme/colors";
import { formatToAppDate } from "../../../src/shared/utils/date";

type ViewMode = "attachments" | "resources";

export default function FileManagerScreen() {
  const theme = Colors[useSettingsStore().theme];
  const [mode, setMode] = useState<ViewMode>("attachments");

  const [attachments, setAttachments] = useState<AttachmentWithSnippetInfo[]>(
    [],
  );

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

  useFocusEffect(
    useCallback(() => {
      if (mode === "attachments") {
        setAttachments(getAllAttachments());
      } else {
        loadResources(currentPath);
      }
    }, [mode, currentPath]),
  );

  const loadResources = async (uri: string) => {
    setIsLoading(true);
    try {
      const items = await getDirectoryContents(uri);
      setResourceItems(items);
    } catch (error) {
      console.error("Failed to load resources:", error);
      Alert.alert("Error", "Could not read directory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttachment = (id: string, fileName: string) => {
    Alert.alert("Delete Attachment", "Permanently delete this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSingleAttachment(id, fileName);
          setAttachments(getAllAttachments());
        },
      },
    ]);
  };

  const navigateUp = () => {
    if (pathHistory.length > 0) {
      const newHistory = [...pathHistory];
      const previousPath = newHistory.pop()!;
      setPathHistory(newHistory);
      setCurrentPath(previousPath);
    }
  };

  const handleResourcePress = (item: any) => {
    if (item.isDirectory) {
      setPathHistory([...pathHistory, currentPath]);
      setCurrentPath(item.uri);
    } else {
      Alert.alert("File Action", `Selected: ${item.name}`, [
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
    }
  };

  const handleDeleteResource = async (uri: string) => {
    try {
      await deleteResource(uri);
      loadResources(currentPath);
    } catch (error) {
      console.error("Failed to delete resource:", error);
      Alert.alert("Error", "Could not delete file.");
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
      console.error("Failed to submit file action:", error);
      Alert.alert("Action Failed", "Please verify your input and try again.");
    } finally {
      setInputValue("");
      setSecondaryInput("");
      setSelectedItemUri(null);
      loadResources(currentPath);
    }
  };

  const renderAttachment = ({ item }: { item: AttachmentWithSnippetInfo }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Image
        source={{ uri: item.file_uri }}
        style={[styles.thumbnail, { borderColor: theme.border }]}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {item.file_name}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.primary }]}
          numberOfLines={1}
        >
          Snippet: {item.snippet_title}
        </Text>
        <Text style={[styles.date, { color: theme.textMuted }]}>
          {formatToAppDate(item.created_at)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteAttachment(item.id, item.file_name)}
        style={styles.actionBtn}
      >
        <Feather name="trash-2" size={20} color={theme.danger} />
      </TouchableOpacity>
    </View>
  );

  const renderResource = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => handleResourcePress(item)}
      onLongPress={
        item.isDirectory ? () => handleDeleteResource(item.uri) : undefined
      }
    >
      <Feather
        name={item.isDirectory ? "folder" : "file"}
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
          File Manager
        </Text>

        <View
          style={[styles.tabContainer, { backgroundColor: theme.background }]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              mode === "attachments" && { backgroundColor: theme.primary },
            ]}
            onPress={() => setMode("attachments")}
          >
            <Text
              style={[
                styles.tabText,
                { color: mode === "attachments" ? "#fff" : theme.textMuted },
              ]}
            >
              Attachments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              mode === "resources" && { backgroundColor: theme.primary },
            ]}
            onPress={() => setMode("resources")}
          >
            <Text
              style={[
                styles.tabText,
                { color: mode === "resources" ? "#fff" : theme.textMuted },
              ]}
            >
              Resources
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === "resources" && (
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
                New
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
                Fetch
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={mode === "attachments" ? attachments : resourceItems}
          keyExtractor={(item) =>
            mode === "attachments"
              ? (item as AttachmentWithSnippetInfo).id
              : (item as unknown as { uri: string }).uri
          }
          renderItem={
            mode === "attachments" ? renderAttachment : renderResource
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Feather
                name={mode === "attachments" ? "image" : "inbox"}
                size={48}
                color={theme.border}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No Files Found
              </Text>
            </View>
          )}
        />
      )}

      {/* Reusable Input Modal */}
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
                placeholder="Enter Template URL (https://...)"
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
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabText: { fontSize: 14, fontWeight: "600" },
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
    paddingVertical: 6,
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
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  thumbnailPlaceholder: { width: 50, textAlign: "center", marginRight: 12 },
  info: { flex: 1, justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  date: { fontSize: 12 },
  actionBtn: { padding: 10, borderRadius: 8, marginLeft: 12 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { borderWidth: 1, borderRadius: 16, padding: 20 },
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
});
