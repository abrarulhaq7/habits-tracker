import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tokens } from "../../lib/tokens";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: tokens.colors.background },
        tabBarActiveTintColor: tokens.colors.accent,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          height: Platform.OS === "ios" ? 88 : 56 + bottomInset,
          paddingBottom: Platform.OS === "ios" ? 28 : bottomInset + 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: tokens.font.size.caption,
          fontWeight: tokens.font.weight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="practices"
        options={{
          title: "Practices",
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Summary",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
