import { db } from "./sqlite";

export const initDB = (): void => {
  try {
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
      console.log("Database initializaton successfull...");
      console.log("Aage badho mere sherr")
      
  } catch (error) {
      console.log("Database initialization failed...", error)
      throw error;
  }
};
