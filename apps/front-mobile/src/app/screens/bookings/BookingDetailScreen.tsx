import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { bookingsApi } from "../../../services/api/bookings.api";
import { formatTimeRange } from "../../../utils/datetime";
import type { BookingsStackParamList } from "../../navigation/BookingsStackNavigator";

type Props = NativeStackScreenProps<BookingsStackParamList, "BookingDetail">;

export function BookingDetailScreen({ route, navigation }: Props) {
  const { booking, classroomTitle } = route.params;
  const [loading, setLoading] = useState(false);

  const timeRange = formatTimeRange(booking.start_time, booking.end_time);
  const canCancel = booking.status === "CONFIRMED";

  async function onCancel() {
    Alert.alert(
      "Cancelar reserva",
      "¿Confirmas que deseas cancelar esta reserva?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await bookingsApi.cancel(booking.booking_id);
              Alert.alert("Reserva cancelada", "La reserva fue cancelada correctamente.");
              navigation.goBack();
            } catch (err) {
              Alert.alert(
                "No se pudo cancelar",
                "Ocurrió un error al cancelar la reserva. Intenta nuevamente."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de reserva</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Aula</Text>
        <Text style={styles.value}>{classroomTitle}</Text>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Horario</Text>
        <Text style={styles.value}>{timeRange}</Text>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Materia / Motivo</Text>
        <Text style={styles.value}>{booking.subject ?? "—"}</Text>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Estado</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{booking.status}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.cancelBtn,
            (!canCancel || loading) && { opacity: 0.55 },
          ]}
          onPress={onCancel}
          disabled={!canCancel || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelText}>
            {loading ? "Cancelando..." : "Cancelar reserva"}
          </Text>
        </TouchableOpacity>

        {!canCancel ? (
          <Text style={styles.note}>
            Esta reserva no se puede cancelar en su estado actual.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xl },
  header: {
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18, fontWeight: "900", color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: "900", color: colors.text },

  card: {
    margin: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, fontWeight: "900", color: "#9CA3AF", letterSpacing: 1 },
  value: { marginTop: 6, fontSize: 15, fontWeight: "800", color: colors.text },

  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "900", color: colors.primary },

  cancelBtn: {
    marginTop: spacing.xl,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },

  note: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
});
