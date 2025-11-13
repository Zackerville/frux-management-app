import { useAuth } from "@/providers/AuthProvider";
import { Redirect, Stack } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';


export default function StaffLayout() {
  const colorScheme = useColorScheme();
  const { user, hydrated } = useAuth();
  if (!hydrated) return null;
  if (user?.role !== 'staff') return <Redirect href="/auth/login" />;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="explore"
        options={{ title: "カウント履歴", presentation: "modal" }}
      />
    </Stack>
  );
}
