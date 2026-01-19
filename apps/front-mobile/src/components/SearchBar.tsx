import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder, onSubmit }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? "Buscar..."}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.0)",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
});
