import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Colors, ColorTheme } from "../../src/shared/theme/colors";
import { useSettingsStore } from "../../src/features/settings/store";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { theme: themePreference, completeOnboarding } = useSettingsStore();
  const theme = Colors[themePreference];

  const styles = useMemo(() => getStyles(theme), [theme]);

  const slides = [
    {
      title: "Capture Snippets",
      description:
        "Save useful code, experiments, and ideas in one searchable place.",
      code: "const user = {\n  name: 'Devansh',\n  role: 'Builder'\n};",
    },
    {
      title: "Organize Everything",
      description: "Group snippets with tags, favorites, and collections.",
      code: "⭐ Favorites\n📁 React\n📁 Expo\n📁 Algorithms",
    },
    {
      title: "Find Anything Fast",
      description: "Search instantly across your personal code vault.",
      code: "🔍 useMemo\n🔍 AsyncStorage\n🔍 Expo Router",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (activeIndex + 1) / slides.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);

  const finishOnboarding = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const next = () => {
    if (activeIndex === slides.length - 1) {
      finishOnboarding();
      return;
    }
    setActiveIndex((prev) => prev + 1);
  };

  const slide = slides[activeIndex];

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.gradient}
      >
        <View style={styles.gridOverlay} />

        <View style={styles.topBar}>
          <Text style={styles.logo}>DevSnippet</Text>

          <Pressable onPress={finishOnboarding}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View style={[styles.content, { opacity: fade }]}>
          <View style={styles.mockup}>
            <View style={styles.mockupHeader}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            <Text style={styles.codeText}>{slide.code}</Text>
          </View>

          <Text style={styles.title}>{slide.title}</Text>

          <Text style={styles.description}>{slide.description}</Text>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: widthInterpolate,
                },
              ]}
            />
          </View>

          <Pressable style={styles.button} onPress={next}>
            <Text style={styles.buttonText}>
              {activeIndex === slides.length - 1
                ? "Start Building →"
                : "Continue →"}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const getStyles = (theme: ColorTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    gradient: {
      flex: 1,
      paddingHorizontal: 24,
    },

    gridOverlay: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.03,
    },

    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 20,
    },

    logo: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },

    skip: {
      color: theme.textMuted,
      fontSize: 15,
    },

    content: {
      flex: 1,
      justifyContent: "center",
    },

    mockup: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 220,
      marginBottom: 40,
    },

    mockupHeader: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 18,
    },

    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.textMuted,
    },

    codeText: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 28,
      fontFamily: "monospace",
    },

    title: {
      color: theme.text,
      fontSize: 36,
      fontWeight: "900",
      marginBottom: 14,
    },

    description: {
      color: theme.textMuted,
      fontSize: 17,
      lineHeight: 28,
    },

    footer: {
      gap: 20,
    },

    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: theme.border,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor: theme.primary,
      borderRadius: 999,
    },

    button: {
      height: 58,
      borderRadius: 29,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
  });
