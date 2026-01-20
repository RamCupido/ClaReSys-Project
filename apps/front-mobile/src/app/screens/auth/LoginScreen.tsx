import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAuthStore } from "../../../store/auth.store";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

console.log("API:", process.env.EXPO_PUBLIC_API_URL);

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    try {
      setLoading(true);
      await login(email, password);
    } catch (err: any) {
      console.log("LOGIN ERROR RAW:", err);
      alert("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ClaReSys</Text>
      <Text style={styles.subtitle}>Acceso Docente</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo institucional"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: spacing.xl,
    fontSize: 16,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
});
