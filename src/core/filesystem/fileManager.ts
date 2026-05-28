import { Directory, File, Paths } from "expo-file-system";

export const attachmentDirectory = new Directory(
  Paths.document,
  "app_snippets_attachments",
);

export const resourcesDirectory = new Directory(
  Paths.document,
  "app_snippets_resources",
);

export const initFileSystem = async (): Promise<void> => {
  try {
    if (!attachmentDirectory.exists) {
      attachmentDirectory.create({
        intermediates: true,
      });
    }

    if (!resourcesDirectory.exists) {
      resourcesDirectory.create({
        intermediates: true,
      });
    }

    console.log("File system initialized successfully");
  } catch (error) {
    console.error("Failed to initialize file system:", error);
    throw error;
  }
};

export const saveAttachment = async (
  tempUri: string,
  fileName: string,
): Promise<string> => {
  try {
    const sourceFile = new File(tempUri);

    const destinationFile = new File(attachmentDirectory, fileName);

    sourceFile.copy(destinationFile);

    return destinationFile.uri;
  } catch (error) {
    console.error(`Failed to save attachment [${fileName}]:`, error);
    throw error;
  }
};

export const deleteAttachment = async (fileName: string): Promise<void> => {
  try {
    const targetFile = new File(attachmentDirectory, fileName);

    if (targetFile.exists) {
      targetFile.delete();
    }
  } catch (error) {
    console.error(`Failed to delete attachment [${fileName}]:`, error);
    throw error;
  }
};

export const createResourceFolder = async (
  parentUri: string,
  folderName: string,
): Promise<void> => {
  try {
    const directory = new Directory(parentUri, folderName);

    directory.create({
      intermediates: true,
    });
  } catch (error) {
    console.error(`Failed to create resource folder [${folderName}]:`, error);

    throw error;
  }
};

export const downloadTemplate = async (
  url: string,
  targetUri: string,
  fileName: string,
): Promise<void> => {
  try {
    const file = new File(targetUri, fileName);

    await File.downloadFileAsync(url, file);
  } catch (error) {
    console.error(`Failed to download template [${fileName}]:`, error);

    throw error;
  }
};

export const moveResource = async (
  sourceUri: string,
  destinationDirUri: string,
  fileName: string,
): Promise<void> => {
  try {
    const sourceFile = new File(sourceUri);

    sourceFile.move(new File(destinationDirUri, fileName));
  } catch (error) {
    console.error(`Failed to move resource [${fileName}]:`, error);
    throw error;
  }
};

export const deleteResource = async (uri: string): Promise<void> => {
  try {
    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error("Failed to delete resource:", error);
    throw error;
  }
};

export const getDirectoryContents = async (uri: string) => {
  try {
    const directory = new Directory(uri);

    const contents = directory.list();

    const detailed = await Promise.all(
      contents.map(async (item) => {
        const info = await item.info();

        return {
          name: item.name,
          uri: item.uri,
          isDirectory: item instanceof Directory,
          size: info.size ?? 0,
          modificationTime: info.modificationTime ?? null,
        };
      }),
    );

    return detailed.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Failed to get directory contents:", error);
    throw error;
  }
};