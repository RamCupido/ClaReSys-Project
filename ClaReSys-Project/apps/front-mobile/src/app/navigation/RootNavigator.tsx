import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/auth.store";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { TabsNavigator } from "./TabsNavigator";
import { CreateBookingModal } from "./CreateBookingModal";

type RootStackParamList = {
  Login: undefined;
  AppTabs: undefined;
  CreateBooking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { token, bootstrap, isLoading } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="AppTabs">
              {(props) => (
                <TabsNavigator
                  {...props}
                  onPressCreate={() => props.navigation.navigate("CreateBooking")}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="CreateBooking"
              component={CreateBookingModal}
              options={{ presentation: "transparentModal" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
