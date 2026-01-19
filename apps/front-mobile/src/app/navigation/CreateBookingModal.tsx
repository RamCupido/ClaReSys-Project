import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { SelectClassroomScreen } from "../screens/bookings/CreateBooking/SelectClassroomScreen";
import { BookingDetailsScreen } from "../screens/bookings/CreateBooking/BookingDetailsScreen";
import type { Classroom } from "../../services/api/classrooms.api";

export type CreateBookingStackParamList = {
  SelectClassroom: undefined;
  BookingDetails: { classroom: Classroom };
};

const Stack = createNativeStackNavigator<CreateBookingStackParamList>();

export function CreateBookingModal({ navigation }: any) {
  return (
    <View style={styles.modalWrap}>
      <View style={styles.sheet}>
        {/* Header del modal */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crear reserva</Text>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stack interno */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SelectClassroom" component={SelectClassroomScreen} />
          <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
        </Stack.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "88%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  header: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
});
