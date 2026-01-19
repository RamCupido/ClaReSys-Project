import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BookingsScreen } from "../screens/bookings/BookingsScreen";
import { BookingDetailScreen } from "../screens/bookings/BookingDetailScreen";

export type BookingsStackParamList = {
  BookingsList: undefined;
  BookingDetail: {
    booking: {
      booking_id: string;
      classroom_id: string;
      status: string;
      start_time: string;
      end_time: string;
      subject?: string;
      user_id: string;
    };
    classroomTitle: string;
  };
};

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsList" component={BookingsScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
    </Stack.Navigator>
  );
}
