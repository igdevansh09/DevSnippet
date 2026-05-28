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

  const slides = useMemo(
    () => [
      {
        eyebrow: "Organize faster",
        title: "Capture the code ideas you love.",
        description:
          "Collect snippets, annotate them, and revisit your best work in seconds.",
        accent: theme.primary,
      },
      {
        eyebrow: "Work smarter",
        title: "Build a personal snippet library.",
        description:
          "Search, favorite, and share clean code blocks without losing your flow.",
        accent: theme.success,
      },
      {
        eyebrow: "Ship with confidence",
        title: "Keep your workflow polished and focused.",
        description:
          "A calm, cinematic interface designed to help you move from idea to implementation.",
        accent: theme.danger,
      },
    ],
    [theme],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 8,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.98,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [fadeAnim, floatAnim, pulseAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, fadeAnim]);

  const currentSlide = useMemo(
    () => slides[activeIndex],
    [activeIndex, slides],
  );

  const finishOnboarding = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      setActiveIndex((prev) => prev + 1);
      return;
    }
    finishOnboarding();
  };

  const handleBack = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <LinearGradient
        colors={[theme.background, theme.surface, theme.codeBackground]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.backgroundGlow} />
        <Animated.View
          style={[
            styles.orb,
            styles.orbA,
            { transform: [{ translateY: floatAnim }] },
          ]}
        />
        <Animated.View
          style={[
            styles.orb,
            styles.orbB,
            { transform: [{ translateY: floatAnim }] },
          ]}
        />

        <Animated.View
          style={[
            styles.shell,
            { opacity: fadeAnim, paddingBottom: 26 + insets.bottom },
          ]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>DevSnippet</Text>
              <Text style={styles.title}>Welcome Laadle</Text>
            </View>
            <Pressable style={styles.skipButton} onPress={finishOnboarding}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <Animated.View
            style={[styles.card, { transform: [{ scale: pulseAnim }] }]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currentSlide.eyebrow}</Text>
              </View>
              <Text style={styles.cardHint}>
                Slide {activeIndex + 1} of {slides.length}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.visual,
                { backgroundColor: currentSlide.accent + "22" },
              ]}
            >
              <View
                style={[
                  styles.visualDot,
                  { backgroundColor: currentSlide.accent },
                ]}
              />
              <View style={styles.visualLines}>
                <View
                  style={[
                    styles.line,
                    { width: "55%", backgroundColor: currentSlide.accent },
                  ]}
                />
                <View style={[styles.line, { width: "75%", opacity: 0.75 }]} />
                <View style={[styles.line, { width: "45%", opacity: 0.6 }]} />
              </View>
            </Animated.View>

            <Text style={styles.cardTitle}>{currentSlide.title}</Text>
            <Text style={styles.cardDescription}>
              {currentSlide.description}
            </Text>

            <View style={styles.tagRow}>
              {["Fast search", "Smart favorites", "Beautiful UI"].map(
                (item) => (
                  <View key={item} style={styles.pill}>
                    <Text style={styles.pillText}>{item}</Text>
                  </View>
                ),
              )}
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.dotRow}>
              {slides.map((slide, index) => (
                <Pressable
                  key={slide.eyebrow}
                  onPress={() => setActiveIndex(index)}
                  style={[
                    styles.dot,
                    index === activeIndex && styles.dotActive,
                  ]}
                  accessibilityLabel={`Go to slide ${index + 1}`}
                />
              ))}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleBack}
                style={[
                  styles.secondaryButton,
                  activeIndex === 0 && styles.secondaryButtonDisabled,
                ]}
                disabled={activeIndex === 0}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
              <LinearGradient
                colors={[theme.primary, theme.success]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Pressable onPress={handleNext} style={styles.primaryPressable}>
                  <Text style={styles.primaryButtonText}>
                    {activeIndex === slides.length - 1
                      ? "Start building"
                      : "Next"}
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const getStyles = (theme: ColorTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    gradient: {
      flex: 1,
    },
    backgroundGlow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: `${theme.primary}14`,
    },
    orb: {
      position: "absolute",
      borderRadius: 999,
      opacity: 0.18,
    },
    orbA: {
      top: 70,
      left: -30,
      width: 160,
      height: 160,
      backgroundColor: theme.primary,
    },
    orbB: {
      right: -45,
      bottom: 130,
      width: 180,
      height: 180,
      backgroundColor: theme.success,
    },
    shell: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 48,
      paddingBottom: 26,
      justifyContent: "space-between",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    eyebrow: {
      color: theme.primaryMuted,
      textTransform: "uppercase",
      letterSpacing: 2,
      fontSize: 12,
      fontWeight: "700",
    },
    title: {
      color: theme.text,
      fontSize: 30,
      fontWeight: "800",
      maxWidth: 220,
      marginTop: 4,
    },
    skipButton: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      backgroundColor: `${theme.surface}cc`,
    },
    skipText: {
      color: theme.text,
      fontWeight: "600",
    },
    card: {
      borderRadius: 28,
      padding: 18,
      backgroundColor: `${theme.surface}f2`,
      borderWidth: 1,
      borderColor: `${theme.border}30`,
      shadowColor: theme.background,
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 18 },
      elevation: 8,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: `${theme.primaryMuted}99`,
    },
    badgeText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.1,
    },
    cardHint: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    visual: {
      borderRadius: 24,
      padding: 14,
      minHeight: 120,
      justifyContent: "center",
      marginBottom: 14,
    },
    visualDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      marginBottom: 10,
    },
    visualLines: {
      gap: 8,
    },
    line: {
      height: 8,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.8)",
    },
    cardTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
      lineHeight: 30,
      marginBottom: 8,
    },
    cardDescription: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: `${theme.border}33`,
      borderWidth: 1,
      borderColor: `${theme.border}4d`,
    },
    pillText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "600",
    },
    footer: {
      gap: 14,
    },
    dotRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: `${theme.border}66`,
    },
    dotActive: {
      width: 24,
      backgroundColor: theme.primary,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: `${theme.border}40`,
      backgroundColor: `${theme.surface}a6`,
    },
    secondaryButtonDisabled: {
      opacity: 0.45,
    },
    secondaryButtonText: {
      color: theme.text,
      fontWeight: "700",
    },
    primaryButton: {
      flex: 1,
      borderRadius: 16,
      overflow: "hidden",
    },
    primaryPressable: {
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryButtonText: {
      color: theme.text,
      fontWeight: "800",
      fontSize: 15,
    },
  });
