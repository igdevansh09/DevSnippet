export interface Snippet {
  id: string;
  title: string;
  content: string;
  language: string;
  tags: string;
  is_favorite: number; 
  created_at: number;
}

export type DefaultSnippet = Omit<Snippet, "is_favorite" | "created_at">;