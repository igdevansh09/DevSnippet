import { db } from "@/core/database/sqlite";
import {
  deleteAttachment,
  saveAttachment,
} from "../../core/filesystem/fileManager";

export interface Attachment {
  id: string;
  snippet_id: string;
  file_name: string;
  file_uri: string;
  created_at: number;
}

export const insertAttachmentRecord = (
  data: Omit<Attachment, "created_at">,
): void => {
  const statement = db.prepareSync(`
        INSERT INTO attachments (id, snippet_id, file_name, file_uri, created_at)
        VALUES ($id, $snippet_id, $file_name, $file_uri, $created_at)
    `);

  try {
    statement.executeSync({
      $id: data.id,
      $snippet_id: data.snippet_id,
      $file_name: data.file_name,
      $file_uri: data.file_uri,
      $created_at: Date.now(),
    });
  } finally {
    statement.finalizeSync();
  }
};

export const getAttachmentsForSnippet = (snippetId: string): Attachment[] => {
  return db.getAllSync<Attachment>(
    "SELECT * FROM attachments WHERE snippet_id = ?",
    snippetId,
  );
};

export const deleteSnippet = async (id: string): Promise<void> => {
  const attachments = getAttachmentsForSnippet(id);

  for (const attachment of attachments) {
    await deleteAttachment(attachment.file_name);
  }

  const statement = db.prepareSync(`DELETE FROM snippets WHERE id = $id`);
  try {
    statement.executeSync({ $id: id });
  } finally {
    statement.finalizeSync();
  }
};

export interface AttachmentWithSnippetInfo extends Attachment {
  snippet_title: string;
}

export const getAllAttachments = (): AttachmentWithSnippetInfo[] => {
  return db.getAllSync<AttachmentWithSnippetInfo>(`
        SELECT a.*, s.title as snippet_title 
        FROM attachments a
        JOIN snippets s ON a.snippet_id = s.id
        ORDER BY a.created_at DESC
    `);
};

export const updateAttachmentRecord = async (
  attachmentId: string,
  oldFileName: string,
  newTempUri: string,
  snippetId: string,
): Promise<string> => {
  await deleteAttachment(oldFileName);

  const extension = newTempUri.split(".").pop() || "jpg";
  const newFileName = `${snippetId}_${attachmentId}_updated.${extension}`;

  const permanentUri = await saveAttachment(newTempUri, newFileName);

  const statement = db.prepareSync(
    "UPDATE attachments SET file_name = $file_name, file_uri = $file_uri WHERE id = $id",
  );
  try {
    statement.executeSync({
      $file_name: newFileName,
      $file_uri: permanentUri,
      $id: attachmentId,
    });
  } finally {
    statement.finalizeSync();
  }

  return permanentUri;
};

export const deleteSingleAttachment = async (
  attachmentId: string,
  fileName: string,
): Promise<void> => {
  await deleteAttachment(fileName);

  const statement = db.prepareSync("DELETE FROM attachments WHERE id = $id");
  try {
    statement.executeSync({ $id: attachmentId });
  } finally {
    statement.finalizeSync();
  }
};
