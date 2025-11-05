import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Logout() {
  useEffect(() => {
    const run = async () => {
      try {
        if (Platform.OS === "web") {
          localStorage.removeItem("role");
          localStorage.removeItem("token");
        } else {
          await AsyncStorage.multiRemove(["role", "token"]);
        }
      } finally {
        router.replace("/auth/login");
      }
    };
    run();
  }, []);
  return null;
}
