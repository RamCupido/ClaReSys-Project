import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../../theme/colors";
import { spacing } from "../../../../theme/spacing";
import { bookingsApi } from "../../../../services/api/bookings.api";
import { formatNaiveLocal } from "../../../../utils/naiveDate";
import type { CreateBookingStackParamList } from "../../../navigation/CreateBookingModal";

type Props = NativeStackScreenProps<CreateBookingStackParamList, "BookingDetails">;

export function BookingDetailsScreen({ route, navigation }: Props) {
  const { classroom } = route.params;

  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d;
  });

  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(0);
    d.setHours(d.getHours() + 1);
    return d;
  });

  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(0);
    d.setHours(d.getHours() + 2);
    return d;
  });

  const [showDate, setShowDate] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Combina (fecha seleccionada) con (hora start/end)
  const startDateTime = useMemo(() => {
    const d = new Date(date);
    d.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    return d;
  }, [date, startTime]);

  const endDateTime = useMemo(() => {
    const d = new Date(date);
    d.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    return d;
  }, [date, endTime]);

  const canSubmit = useMemo(() => {
    return endDateTime.getTime() > startDateTime.getTime();
  }, [startDateTime, endDateTime]);

  async function onSubmit() {
    if (!canSubmit) {
      alert("La hora de fin debe ser mayor a la hora de inicio.");
      return;
    }

    try {
      setSaving(true);

      await bookingsApi.create({
        classroom_id: classroom.id,
        start_time: formatNaiveLocal(startDateTime),
        end_time: formatNaiveLocal(endDateTime),
        subject: subject.trim() ? subject.trim() : undefined,
      });

      // Cierra modal completo (vuelve a tabs)
      navigation.getParent()?.goBack();
    } catch (err: any) {
      // si tu backend retorna 409 por conflicto, aquí lo verás
      alert("No se pudo crear la reserva. Revisa disponibilidad y horarios.");
    } finally {
      setSaving(false);
    }
  }

  function onPickDate(_: DateTimePickerEvent, selected?: Date) {
    setShowDate(Platform.OS === "ios");
    if (selected) setDate(selected);
  }

  function onPickStart(_: DateTimePickerEvent, selected?: Date) {
    setShowStart(Platform.OS === "ios");
    if (selected) setStartTime(selected);
  }

  function onPickEnd(_: DateTimePickerEvent, selected?: Date) {
    setShowEnd(Platform.OS === "ios");
    if (selected) setEndTime(selected);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Detalles</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Aula</Text>
        <Text style={styles.value}>
          {classroom.code} · {classroom.location_details}
        </Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDate(true)} activeOpacity={0.85}>
            <Text style={styles.pickerLabel}>Fecha</Text>
            <Text style={styles.pickerValue}>{date.toLocaleDateString("es-EC")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowStart(true)} activeOpacity={0.85}>
            <Text style={styles.pickerLabel}>Hora inicio</Text>
            <Text style={styles.pickerValue}>
              {startDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowEnd(true)} activeOpacity={0.85}>
            <Text style={styles.pickerLabel}>Hora fin</Text>
            <Text style={styles.pickerValue}>
              {endDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </TouchableOpacity>
        </View>

        {!canSubmit ? (
          <Text style={styles.validation}>La hora fin debe ser mayor a la hora inicio.</Text>
        ) : null}

        <Text style={[styles.label, { marginTop: spacing.md }]}>Motivo / Materia</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Programación 1"
          placeholderTextColor="#94A3B8"
          value={subject}
          onChangeText={setSubject}
        />

        <TouchableOpacity
          style={[styles.submit, (!canSubmit || saving) && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={!canSubmit || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>{saving ? "Guardando..." : "Confirmar reserva"}</Text>
        </TouchableOpacity>

        <Text style={styles.debug}>
          Se enviará:
          {"\n"}start_time: {formatNaiveLocal(startDateTime)}
          {"\n"}end_time: {formatNaiveLocal(endDateTime)}
        </Text>
      </View>

      {showDate && (
        <DateTimePicker value={date} mode="date" onChange={onPickDate} />
      )}
      {showStart && (
        <DateTimePicker value={startTime} mode="time" is24Hour onChange={onPickStart} />
      )}
      {showEnd && (
        <DateTimePicker value={endTime} mode="time" is24Hour onChange={onPickEnd} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.md },
  title: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: spacing.sm },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, fontWeight: "900", color: "#9CA3AF", letterSpacing: 1 },
  value: { marginTop: 6, fontSize: 14, fontWeight: "800", color: colors.text },
  row: { flexDirection: "row", gap: 12, marginTop: spacing.md },
  pickerBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  pickerLabel: { fontSize: 12, fontWeight: "900", color: "#64748B" },
  pickerValue: { marginTop: 6, fontSize: 14, fontWeight: "900", color: colors.text },
  validation: { marginTop: 10, fontSize: 12, fontWeight: "800", color: "#B91C1C" },
  input: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submit: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  debug: {
    marginTop: spacing.md,
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },
});
