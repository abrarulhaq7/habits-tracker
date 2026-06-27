// Boot MSW first — must be imported before any component or fetch() call
import "../mocks";
import "../mocks/polyfills";

import { PracticesProvider } from "@/context/PracticesContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { tokens } from "../lib/tokens";
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

// Set system UI background color as early as possible
SystemUI.setBackgroundColorAsync(tokens.colors.background).catch((err) => {
  console.warn("Failed to set system background color", err);
});

export default function RootLayout() {
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
