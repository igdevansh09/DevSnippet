import * as SecureStore from "expo-secure-store";

const API_KEY_NAME = "user_ai_api_key";

export const saveApiKey = async (key: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(API_KEY_NAME, key);
        console.log("API key saved successfully");
    } catch (error) {
        console.log("Error saving API key", error)
        throw error;
    }
}

export const getApiKey = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(API_KEY_NAME);
    } catch (error) {
        console.log("Error getting API key", error)
        throw error;
    }
}

export const deleteApiKey = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(API_KEY_NAME);
        console.log("API key deleted successfully");
    } catch (error) {
        console.log("Error deleting API key", error)
        throw error;
    }
}