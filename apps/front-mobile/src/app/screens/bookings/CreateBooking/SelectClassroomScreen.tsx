import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../../theme/colors";
import { spacing } from "../../../../theme/spacing";
import { classroomsApi, Classroom } from "../../../../services/api/classrooms.api";
import type { CreateBookingStackParamList } from "../../../navigation/CreateBookingModal";

type Props = NativeStackScreenProps<CreateBookingStackParamList, "SelectClassroom">;

export function SelectClassroomScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cls = await classroomsApi.listOperational();
        setClassrooms(cls);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classrooms;

    return classrooms.filter((c) => {
      return (
        c.code.toLowerCase().includes(q) ||
        String(c.capacity ?? "").includes(q) ||
        (c.location_details ?? "").toLowerCase().includes(q)
      );
    });
  }, [classrooms, query]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Selecciona un aula</Text>

      <TextInput
        style={styles.input}
        placeholder="Buscar por código, capacidad o ubicación..."
        placeholderTextColor="#94A3B8"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.card}
              onPress={() => navigation.navigate("BookingDetails", { classroom: item })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.code}</Text>
                <Text style={styles.cardSub}>
                  Capacidad: {item.capacity} · {item.location_details}
                </Text>
              </View>
              <Text style={styles.pick}>Elegir</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No hay resultados</Text>
              <Text style={styles.emptySub}>Intenta con otro criterio de búsqueda.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.md },
  title: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  cardSub: { marginTop: 4, fontSize: 13, fontWeight: "600", color: colors.muted },
  pick: { fontWeight: "900", color: colors.primary },
  empty: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
  },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: colors.text },
  emptySub: { marginTop: 6, fontSize: 13, fontWeight: "600", color: colors.muted },
});
