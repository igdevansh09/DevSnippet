import { Snippet } from "@/features/snippets/types";
import { File, Directory, Paths } from "expo-file-system"
import { formatToAppDate } from "./date";

const export_directory = new Directory(Paths.cache, "export")

const sanitizeFileName = (title: string): string => {
    return title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

export const generateExportFile = async (snippet: Snippet, format: "txt" | "json" | "js"): Promise<String> => {
    try {
        if (!export_directory.exists) export_directory.create()
        
        const safeTitle = sanitizeFileName(snippet.title);
        const fileName = `${safeTitle}_${Date.now()}.${format}`;
        const targetFile = new File(export_directory, fileName);

        let content = ""

        if (format === "json") {
          content = JSON.stringify(snippet, null, 2);
        } else {
          const commentPrefix = format === "js" ? "//" : "";
          const formattedDate = formatToAppDate(snippet.created_at);

          content = `${commentPrefix} Title: ${snippet.title}\n`;
          content += `${commentPrefix} Language: ${snippet.language}\n`;
          content += `${commentPrefix} Created: ${formattedDate}\n`;
          content += `${commentPrefix} Tags: ${JSON.parse(snippet.tags).join(", ")}\n\n`;
          content += snippet.content;
        }

        await targetFile.write(content)
        return targetFile.uri
    } catch (error) {
        console.error("Error generating export file:", error)
        throw error
    }
}