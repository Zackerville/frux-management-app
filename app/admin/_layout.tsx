import { Tabs } from 'expo-router';
import React from 'react';
import {Redirect, Stack} from "expo-router"
import {useAuth} from "@/providers/AuthProvider"

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AdminLayout() {
    const colorScheme = useColorScheme();
    const { user, hydrated } = useAuth();
    if (!hydrated) return null
    if (user?.role != 'admin') return <Redirect href='/auth/login' />

    return <Stack screenOptions={{headerShown: false}} />;

}