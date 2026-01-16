import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  titleTop: string;
  titleMain: string;
  onPressBell?: () => void;
};

export function AppHeader({ titleTop, titleMain, onPressBell }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials(titleMain)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.top}>{titleTop}</Text>
          <Text style={styles.main}>{titleMain}</Text>
        </View>

        <TouchableOpacity style={styles.bell} onPress={onPressBell} activeOpacity={0.8}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "U";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "800",
    color: "#1F2937",
  },
  top: {
    color: "#DCE6FF",
    fontSize: 14,
    fontWeight: "600",
  },
  main: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellIcon: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
});
