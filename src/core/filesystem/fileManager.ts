import { Directory, File, Paths } from "expo-file-system";

export const attachment_directory = new Directory(
  Paths.document,
  "app_snippets_attachments",
);

export const initFileSystem = (): void => {
  try {
    if (!attachment_directory.exists) {
      attachment_directory.create();
      console.log("File system initialization successfull...");
    } else {
      console.log("File system already initialized...");
    }
  } catch (error) {
    console.error("Failed to initialize file system", error);
    throw error;
  }
};


export const saveAttachment = async (
  tempUri: string,
  fileName: string,
): Promise<string> => {
  try {
    const sourceFile = new File(tempUri);
    const destinationFile = new File(attachment_directory, fileName);

    await sourceFile.copy(destinationFile);
    return destinationFile.uri;
  } catch (error) {
    console.error(`Failed to save attachment [${fileName}]:`, error);
    throw error;
  }
};


export const deleteAttachment = async (fileName: string): Promise<void> => {
  try {
    const targetFile = new File(attachment_directory, fileName);
    if (targetFile.exists) {
      await targetFile.delete();
    }
  } catch (error) {
    console.error(`Failed to delete attachment [${fileName}]:`, error);
    throw error;
  }
};