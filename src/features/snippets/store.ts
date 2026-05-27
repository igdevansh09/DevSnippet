import { create } from "zustand";
import {
  deleteSnippet,
  getAllSnippets,
  insertSnippet,
  toggleFavorite,
  updateSnippet,
} from "./repository";
import { DefaultSnippet, Snippet } from "./types";

interface SnippetState {
  snippets: Snippet[];
  isLoading: boolean;
  error: string | null;

  loadSnippets: () => void;
  addSnippet: (data: DefaultSnippet) => void;
  removeSnippet: (id: string) => void;
  editSnippet: (id: string, data: DefaultSnippet) => void;
  toggleFavorite: (id: string) => void;
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  isLoading: true,
  error: null,

  loadSnippets: () => {
    try {
      set({ isLoading: true, error: null });
      const data = getAllSnippets();
      set({ snippets: data, isLoading: false });
    } catch (error) {
      console.error("Failed to load snippets:", error);
      set({ error: "Failed to load snippets", isLoading: false });
    }
  },

  addSnippet: (data: DefaultSnippet) => {
    try {
      insertSnippet(data);
      get().loadSnippets();
    } catch (error) {
      console.error("Failed to add snippet:", error);
      set({ error: "Failed to create snippet" });
    }
  },

  removeSnippet: (id: string) => {
    try {
      deleteSnippet(id);
      get().loadSnippets();
    } catch (error) {
      console.error("Failed to delete snippet:", error);
      set({ error: "Failed to delete snippet" });
    }
  },

  editSnippet: (id: string, data: DefaultSnippet) => {
    try {
      updateSnippet(id, data);
      get().loadSnippets();
    } catch (error) {
      console.error("Failed to edit snippet:", error);
      set({ error: "Failed to update snippet" });
    }
  },

  toggleFavorite: (id: string) => {
    try {
      toggleFavorite(id);
      get().loadSnippets();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      set({ error: "Failed to update favorite status" });
    }
  },
}));
