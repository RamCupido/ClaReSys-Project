import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { useAuthStore } from "../../../store/auth.store";

export function ProfileScreen() {
  const logout = useAuthStore((s: any) => s.logout); // si quieres, tipamos AuthState igual que antes

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Perfil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Cuenta</Text>
        <Text style={styles.value}>Docente</Text>

        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xl },
  title: {
    paddingHorizontal: spacing.md,
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    margin: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, fontWeight: "900", color: "#9CA3AF", letterSpacing: 1 },
  value: { marginTop: 6, fontSize: 16, fontWeight: "800", color: colors.text },
  button: {
    marginTop: spacing.lg,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "900" },
});
