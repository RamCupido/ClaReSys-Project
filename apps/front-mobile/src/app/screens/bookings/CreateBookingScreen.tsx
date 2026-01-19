import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export function CreateBookingScreen({ navigation }: any) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Crear Reserva</Text>
        <Text style={styles.sub}>
          Siguiente paso: aquí implementamos seleccionar aula, fecha/hora y subject.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800" },
});
