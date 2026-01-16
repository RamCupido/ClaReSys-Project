import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { bookingsApi, Booking } from "../../../services/api/bookings.api";
import { classroomsApi, Classroom } from "../../../services/api/classrooms.api";
import { formatTimeRange, formatMonthDay } from "../../../utils/datetime";
import { UpcomingBookingCard } from "../../../components/UpcomingBookingCard";

export function BookingsScreen() {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const classroomCodeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of classrooms) map[c.id] = c.code;
    return map;
  }, [classrooms]);

  async function load() {
    setLoading(true);
    try {
      const [cls, bks] = await Promise.all([
        classroomsApi.listOperational(),
        bookingsApi.list(),
      ]);
      setClassrooms(cls);
      setBookings(bks);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis Reservas</Text>

      <FlatList
        data={bookings}
        keyExtractor={(b) => b.booking_id}
        contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => {
          const { month, day } = formatMonthDay(item.start_time);
          const classroomTitle = classroomCodeById[item.classroom_id] ?? "Aula";
          const time = formatTimeRange(item.start_time, item.end_time);
          const subtitle = item.subject ? `${item.subject} · ${time}` : time;

          return (
            <UpcomingBookingCard
              month={month}
              day={day}
              title={classroomTitle}
              subtitle={subtitle}
              onPress={() => {
                // siguiente paso: detalle de reserva
              }}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tienes reservas</Text>
            <Text style={styles.emptySub}>Crea una desde el botón +.</Text>
          </View>
        }
      />
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
  empty: {
    marginTop: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  emptySub: { marginTop: 6, fontSize: 13, fontWeight: "600", color: colors.muted },
});
