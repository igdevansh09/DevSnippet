import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { initDB } from "../../src/core/database/schema";
import { initFileSystem } from "../../src/core/filesystem/fileManager";
import { useSettingsStore } from "../../src/features/settings/store";
import { useSnippetStore } from "../../src/features/snippets/store";
import { Colors } from "../../src/shared/theme/colors";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLaunched = useSettingsStore((state) => state.isFirstLaunched);
  const theme = Colors[useSettingsStore((state) => state.theme)];

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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <Text style={{ color: theme.danger }}>{error}</Text>
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
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textMuted, marginTop: 16 }}>
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
