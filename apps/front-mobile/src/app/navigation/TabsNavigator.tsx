import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { HomeScreen } from "../screens/home/HomeScreen";
import { BookingsStackNavigator } from "./BookingsStackNavigator";
import { ProfileScreen } from "../screens/profile/ProfileScreen";

type TabsParamList = {
  Home: undefined;
  Bookings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

type Props = {
  onPressCreate: () => void;
};

export function TabsNavigator({ onPressCreate }: Props) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size ?? 24}
              color={focused ? colors.primary : "#94A3B8"}
            />
          ),
        }}
      />

      {/* Tab “dummy” para reservar espacio al FAB */}
      <Tab.Screen
        name="Bookings"
        component={BookingsStackNavigator}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size ?? 24}
              color={focused ? colors.primary : "#94A3B8"}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size ?? 24}
              color={focused ? colors.primary : "#94A3B8"}
            />
          ),
        }}
      />

      {/* FAB overlay centrado */}
      <Tab.Screen
        name={"__FAB__" as any}
        component={Dummy}
        options={{
          tabBarButton: () => (
            <View style={styles.fabWrap} pointerEvents="box-none">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPressCreate}
                style={styles.fab}
              >
                <Ionicons name="add" size={30} color="#0F172A" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function Dummy() {
  return null;
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    paddingBottom: Platform.OS === "ios" ? 14 : 10,
    paddingTop: 10,
  },
  fabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -18,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accent, // amarillo
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
