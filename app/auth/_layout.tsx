// app/auth/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';

export default function AuthLayout() {
  const { user, hydrated } = useAuth();
  if (!hydrated) return null;

  if (user?.role === 'staff') return <Redirect href="/staff" />;
  if (user?.role === 'admin') return <Redirect href="/admin" />;

  return <Stack screenOptions={{headerShown: false}} />;
}
