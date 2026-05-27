import * as Sharing from "expo-sharing";

export const shareFile = async (fileUri: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      throw new Error("Sharing is not available on this device.");
    }

    await Sharing.shareAsync(fileUri, {
      dialogTitle: "Share Code Snippet", 
      mimeType: "text/plain", 
    });
  } catch (error) {
    console.error("Failed to invoke native share sheet:", error);
    throw error; 
  }
};
