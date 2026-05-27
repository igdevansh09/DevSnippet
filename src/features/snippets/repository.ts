import { db } from "@/core/database/sqlite";
import { DefaultSnippet, Snippet } from "./types";

export const insertSnippet = (data: DefaultSnippet): void => {
  const statement = db.prepareSync(`
        INSERT INTO snippets (id, title, content, language, tags, is_favorite, created_at)
        VALUES ($id, $title, $content, $language, $tags, $is_favorite, $created_at)
        `);

  const currentDate = Date.now();

  try {
    statement.executeSync({
      $id: data.id,
      $title: data.title,
      $content: data.content,
      $language: data.language,
      $tags: data.tags,
      $is_favorite: 0,
      $created_at: currentDate,
    });
  } finally {
    statement.finalizeSync();
  }
};

export const getAllSnippets = (): Snippet[] => {
  return db.getAllSync<Snippet>(
    "SELECT * FROM snippets ORDER BY created_at DESC",
  );
};

export const getSnippetById = (id: string): Snippet | null => {
  return db.getFirstSync<Snippet>(`SELECT * FROM snippets WHERE id = ?`, id);
};

export const updateSnippet = (id: string, data: DefaultSnippet): void => {
  const statement = db.prepareSync(`
            UPDATE snippets SET title = $title, content = $content, language = $language, tags = $tags
            WHERE id = $id
        `);

  try {
    statement.executeSync({
      $id: id,
      $title: data.title,
      $content: data.content,
      $language: data.language,
      $tags: data.tags,
    });
  } finally {
    statement.finalizeSync();
  }
};

export const toggleFavorite = (id: string): void => {
  const statement = db.prepareSync(
    "UPDATE snippets SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = $id",
  );
  try {
    statement.executeSync({
      $id: id,
    });
  } finally {
    statement.finalizeSync();
  }
};

export const deleteSnippet = (id: string): void => {
  const statement = db.prepareSync(`DELETE FROM snippets WHERE id = $id`);
  try {
    statement.executeSync({
      $id: id,
    });
  } finally {
    statement.finalizeSync();
  }
};
