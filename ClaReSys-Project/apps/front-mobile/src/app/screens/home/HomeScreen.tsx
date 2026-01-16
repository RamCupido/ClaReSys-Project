import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { AppHeader } from "../../../components/AppHeader";
import { SearchBar } from "../../../components/SearchBar";
import { NowClassCard } from "../../../components/NowClassCard";
import { UpcomingBookingCard } from "../../../components/UpcomingBookingCard";
import { classroomsApi, Classroom } from "../../../services/api/classrooms.api";
import { bookingsApi, Booking } from "../../../services/api/bookings.api";
import { formatMonthDay, formatTimeRange, isFuture, isNowBetween } from "../../../utils/datetime";
import { useFocusEffect } from "@react-navigation/native";

type UpcomingItem = {
  bookingId: string;
  month: string;
  day: string;
  classroomTitle: string;
  subject?: string;
};

export function HomeScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // En tu app real, esto debe venir del store (auth.store) o del JWT decodificado
  const teacherName = "Ramsés";
  const teacherTop = "Hola, Docente";

  const classroomCodeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of classrooms) map[c.id] = c.code;
    return map;
  }, [classrooms]);

  const activeBooking = useMemo(() => {
    return bookings.find(
      (b) => b.status === "CONFIRMED" && isNowBetween(b.start_time, b.end_time)
    );
  }, [bookings]);

  const upcomingList: UpcomingItem[] = useMemo(() => {
    const upcoming = bookings
      .filter((b) => b.status === "CONFIRMED" && isFuture(b.start_time))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return upcoming.map((b) => {
      const { month, day } = formatMonthDay(b.start_time);
      return {
        bookingId: b.booking_id,
        month,
        day,
        classroomTitle: classroomCodeById[b.classroom_id] ?? "Aula",
        subject: b.subject,
      };
    });
  }, [bookings, classroomCodeById]);

  async function load() {
    setLoading(true);
    try {
      // 1) aulas operativas (para resolver classroom_id -> code)
      const cls = await classroomsApi.listOperational();
      setClassrooms(cls);

      // 2) bookings (query)
      const bks = await bookingsApi.list();
      setBookings(bks);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <AppHeader
        titleTop={teacherTop}
        titleMain={teacherName}
        onPressBell={() => {
          // futuro: navegación a notificaciones
        }}
      />

      <View style={styles.content}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar aula (ej. Lab 1)..."
          onSubmit={() => {
            // En el siguiente paso hacemos la pantalla SearchClassrooms
            // y navegamos con el query.
          }}
        />

        <View style={{ marginTop: spacing.md }}>
          {activeBooking ? (
            <NowClassCard
              classroomCode={classroomCodeById[activeBooking.classroom_id] ?? "Aula"}
              timeRange={formatTimeRange(activeBooking.start_time, activeBooking.end_time)}
              statusLabel="EN CLASE"
              subject={activeBooking.subject}
            />
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>MIS PRÓXIMAS CLASES</Text>

        <FlatList
          data={upcomingList}
          keyExtractor={(i) => i.bookingId}
          contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <UpcomingBookingCard
              month={item.month}
              day={item.day}
              title={item.classroomTitle}
              subtitle={item.subject}
              onPress={() => {
                // siguiente iteración: BookingDetail
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tienes clases próximas</Text>
              <Text style={styles.emptySub}>
                Crea una reserva con el botón + (lo implementamos después).
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    marginTop: -18, // sube el search para que “flote” sobre el header como en tu imagen
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#9CA3AF",
  },
  empty: {
    marginTop: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
});
