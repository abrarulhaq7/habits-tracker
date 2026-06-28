import "../mocks";
import "../mocks/polyfills";

import { PracticesProvider } from "@/context/PracticesContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { tokens } from "../lib/tokens";

// Set system UI background color as early as possible (Before rendering)
SystemUI.setBackgroundColorAsync(tokens.colors.background).catch((err) => {
  console.warn("Failed to set system background color", err);
});

export default function RootLayout() {
  // Set system UI background color as early as possible (Component Mount)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(tokens.colors.background).catch((err) => {
      console.warn("Failed to set system background color in useEffect", err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <PracticesProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tokens.colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </PracticesProvider>
    </SafeAreaProvider>
  );
}
