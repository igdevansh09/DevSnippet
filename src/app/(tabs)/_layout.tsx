import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettingsStore } from "../../../src/features/settings/store";
import { Colors } from "../../../src/shared/theme/colors";

export default function TabLayout() {
  const { theme } = useSettingsStore();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          marginBottom: insets.bottom,
          marginHorizontal: 5,
          overflow: "hidden",
          borderRadius: 28,
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 2,
          overflow: "hidden",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Snippets",
          tabBarActiveBackgroundColor: colors.primary,
          tabBarIcon: ({ color, size }) => (
            <Feather name="code" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favourites",
          tabBarActiveBackgroundColor: colors.primary,
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="files"
        options={{
          title: "Files",
          tabBarActiveBackgroundColor: colors.primary,
          tabBarIcon: ({ color, size }) => (
            <Feather name="folder" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarActiveBackgroundColor: colors.primary,
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
