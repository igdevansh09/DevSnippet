import { Feather } from "@expo/vector-icons";
import { File } from "expo-file-system";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

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
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: item.isDirectory
              ? `${theme.primary}15`
              : theme.codeBackground,
          },
        ]}
      >
        <Feather
          name={item.isDirectory ? "folder" : "file-text"}
          size={24}
          color={item.isDirectory ? theme.primary : theme.textMuted}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          {!item.isDirectory && (
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {(item.size / 1024).toFixed(1)} KB
            </Text>
          )}
          {item.modificationTime && (
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {item.isDirectory ? "" : " • "}
              {formatToAppDate(item.modificationTime * 1000)}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.optionsBtn}
        onPress={() => handleOpenOptions(item)}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Feather name="more-vertical" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const currentFolderName =
    currentPath === resourcesDirectory.uri
      ? "Root"
      : currentPath.split("/").filter(Boolean).pop() || "Folder";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Dynamic Header respecting Insets and standard Typography */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background, paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Files</Text>

        {/* Breadcrumb Trail */}
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity
            onPress={navigateUp}
            disabled={pathHistory.length === 0}
            style={styles.breadcrumbBack}
          >
            <Feather
              name="chevron-left"
              size={20}
              color={pathHistory.length === 0 ? theme.border : theme.primary}
            />
          </TouchableOpacity>
          <Feather name="folder" size={14} color={theme.textMuted} />
          <Text style={[styles.breadcrumbText, { color: theme.textMuted }]}>
            {currentFolderName}
          </Text>
        </View>
      </View>

      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
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
          <Text style={[styles.toolbarBtnText, { color: theme.text }]}>
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
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Feather name="download-cloud" size={16} color={theme.text} />
          <Text style={[styles.toolbarBtnText, { color: theme.text }]}>
            Fetch File
          </Text>
        </TouchableOpacity>
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
          showsVerticalScrollIndicator={false}
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

      {/* Input Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}
        >
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
                    backgroundColor: theme.background,
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
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder={
                modalType === "folder"
                  ? "Folder Name"
                  : modalType === "download"
                    ? "Save As (e.g., config.json)"
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
                style={styles.cancelBtn}
              >
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitModal}
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* File Viewer Modal */}
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
              <Feather name="x" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={[
              styles.viewerScroll,
              { backgroundColor: theme.codeBackground },
            ]}
          >
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32, // Realigned to Dashboard scale
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breadcrumbBack: {
    paddingRight: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: "600",
  },
  toolbar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  toolbarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12, // Match rounded system
    gap: 8,
  },
  toolbarBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120, // Accommodate tab bar
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  info: { flex: 1, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  subtitle: { fontSize: 13, fontWeight: "600" },
  date: { fontSize: 13, fontWeight: "500" },
  optionsBtn: { padding: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 16 },
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },

  // Viewer
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  viewerTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 16 },
  viewerScroll: { flex: 1, padding: 20 },
  viewerText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
    lineHeight: 22,
  },
});
