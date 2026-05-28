import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { initDB } from "../../src/core/database/schema";
import { initFileSystem } from "../../src/core/filesystem/fileManager";
import { useSettingsStore } from "../../src/features/settings/store";
import { useSnippetStore } from "../../src/features/snippets/store";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLaunched = useSettingsStore((state) => state.isFirstLaunched);

  useEffect(() => {
    const bootApp = async () => {
      try {
        initDB();
        await initFileSystem();
        await useSettingsStore.getState().loadPreferences();
        useSnippetStore.getState().loadSnippets();

        setIsReady(true);
      } catch (e) {
        console.error("Critical failure during boot sequence:", e);
        setError("The application failed to initialize.");
      }
    };

    bootApp();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0d1117",
        }}
      >
        <ActivityIndicator size="large" color="#58a6ff" />
        <Text style={{ color: "#c9d1d9", marginTop: 16 }}>
          Hydrating State...
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName={isFirstLaunched ? "index" : "(tabs)"}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="snippets/create" />
    </Stack>
  );
}
