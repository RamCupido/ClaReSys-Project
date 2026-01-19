import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

import { AppHeader } from "../../../components/AppHeader";
import { SearchBar } from "../../../components/SearchBar";
import { NowClassCard } from "../../../components/NowClassCard";
import { UpcomingBookingCard } from "../../../components/UpcomingBookingCard";

import { classroomsApi, Classroom } from "../../../services/api/classrooms.api";
import { bookingsApi, Booking } from "../../../services/api/bookings.api";

import { formatMonthDay, formatTimeRange, isFuture, isNowBetween, } from "../../../utils/datetime";

type UpcomingItem = {
  booking: Booking;
  month: string;
  day: string;
  classroomTitle: string;
  subtitle: string;
};

export function HomeScreen() {
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const teacherTop = "Bienvenido,";
  const teacherName = "Hola Docente";

  const classroomCodeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of classrooms) map[c.id] = c.code;
    return map;
  }, [classrooms]);

  const confirmedBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "CONFIRMED");
  }, [bookings]);

  const activeBooking = useMemo(() => {
    return confirmedBookings.find((b) => isNowBetween(b.start_time, b.end_time));
  }, [confirmedBookings]);

  const upcomingList: UpcomingItem[] = useMemo(() => {
    const upcoming = confirmedBookings
      .filter((b) => isFuture(b.start_time))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return upcoming.map((b) => {
      const { month, day } = formatMonthDay(b.start_time);
      const classroomTitle = classroomCodeById[b.classroom_id] ?? "Aula";
      const time = formatTimeRange(b.start_time, b.end_time);
      const subtitle = b.subject ? `${b.subject} · ${time}` : time;

      return {
        booking: b,
        month,
        day,
        classroomTitle,
        subtitle,
      };
    });
  }, [confirmedBookings, classroomCodeById]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Aulas operativas (para resolver classroom_id -> code)
      const cls = await classroomsApi.listOperational();
      setClassrooms(cls);

      // 2) Bookings (query)
      const bks = await bookingsApi.list();
      setBookings(bks);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresca siempre al volver a Home (ideal para reflejar create/cancel)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openBookingDetail(booking: Booking, classroomTitle: string) {
    // Navega al tab Bookings y abre el detalle dentro del stack de Bookings
    navigation.navigate("Bookings", {
      screen: "BookingDetail",
      params: { booking, classroomTitle },
    });
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        titleTop={teacherTop}
        titleMain={teacherName}
        onPressBell={() => {
          // futuro: notificaciones
        }}
      />

      <View style={styles.content}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar aula (ej. AULAS A-33)..."
          onSubmit={() => {
            // Siguiente iteración: navegar a pantalla de búsqueda si la agregas como modal/stack
            // Por ahora, se queda como input visual.
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
          ) : (
            <View style={styles.noActiveCard}>
              <Text style={styles.noActiveTitle}>Sin clase activa</Text>
              <Text style={styles.noActiveSub}>
                Revisa tus próximas reservas o crea una nueva con el botón +.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>MIS PRÓXIMAS CLASES</Text>

        <FlatList
          data={upcomingList}
          keyExtractor={(i) => i.booking.booking_id}
          contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <UpcomingBookingCard
              month={item.month}
              day={item.day}
              title={item.classroomTitle}
              subtitle={item.subtitle}
              onPress={() => openBookingDetail(item.booking, item.classroomTitle)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tienes clases próximas</Text>
              <Text style={styles.emptySub}>
                Crea una reserva desde el botón + para que aparezca aquí.
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
    marginTop: -18,
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
    backgroundColor: "rgba(255,255,255,0.9)",
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
  noActiveCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noActiveTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.text,
  },
  noActiveSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    lineHeight: 18,
  },
});
