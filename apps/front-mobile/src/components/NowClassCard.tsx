import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  classroomCode: string;
  timeRange: string;
  statusLabel?: string;
  subject?: string;
};

export function NowClassCard({ classroomCode, timeRange, statusLabel = "EN CLASE", subject }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.leftBar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{classroomCode}</Text>
        {subject ? <Text style={styles.subject}>{subject}</Text> : null}
        <View style={styles.row}>
          <Text style={styles.time}>🕒 {timeRange}</Text>
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  leftBar: {
    width: 5,
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#22C55E",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  subject: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    marginTop: 8,
  },
  time: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.successText,
    fontWeight: "800",
    fontSize: 12,
  },
});
