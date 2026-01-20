import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export type SegmentOption<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
};

export function SegmentedFilter<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onChange(o.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  itemActive: {
    backgroundColor: "#EEF2FF",
  },
  text: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
  },
  textActive: {
    color: colors.primary,
  },
});
