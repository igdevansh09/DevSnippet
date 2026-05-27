import * as Network from "expo-network";

export class OfflineError extends Error {
  constructor(message = "Internet connection required for AI features.") {
    super(message);
    this.name = "OfflineError";
  }
}

export class ApiKeyError extends Error {
  constructor(message = "AI API key is missing. Please set it in settings.") {
    super(message);
    this.name = "ApiKeyError";
  }
}

export const generateSnippetExplanation = async (
  code: string,
  apiKey: string | null,
): Promise<string> => {
  if (!apiKey) {
    throw new ApiKeyError();
  }

  const networkState = await Network.getNetworkStateAsync();
  if (!networkState.isConnected || !networkState.isInternetReachable) {
    throw new OfflineError();
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert software engineer. Explain the following code snippet concisely. Identify the language, explain the core logic, and point out any potential improvements or vulnerabilities:\n\n${code}`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`AI Provider responded with status: ${response.status}`);
    }

    const data = await response.json();

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    if (error instanceof OfflineError || error instanceof ApiKeyError) {
      throw error;
    }

    console.error("AI Generation Failed:", error);
    throw new Error(
      "Failed to generate explanation. Check your API key and try again.",
    );
  }
};
