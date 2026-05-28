import { db } from "./sqlite";

export const initDB = (): void => {
    try {
      db.execSync("PRAGMA foreign_keys = ON;");
    db.execSync(`
            CREATE TABLE IF NOT EXISTS snippets (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                language TEXT NOT NULL,
                tags TEXT NOT NULL,
                is_favorite INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            );
            `);
      
      db.execSync(`
            CREATE TABLE IF NOT EXISTS attachments (
                id TEXT PRIMARY KEY,
                snippet_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_uri TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (snippet_id) REFERENCES snippets (id) ON DELETE CASCADE
            );
        `);
      console.log("Database initializaton successfull...");
      console.log("Aage badho mere sherr")
      
  } catch (error) {
      console.log("Database initialization failed...", error)
      throw error;
  }
};
