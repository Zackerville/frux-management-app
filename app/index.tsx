import { Redirect } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";

export default function Index() {
  // const { user, hydrated } = useAuth(); 
  // if (!hydrated) return null; 

  // if (!user) return <Redirect href="/auth/login" />;
  // if (user.role === "staff") return <Redirect href="/staff" />;
  // if (user.role === "admin") return <Redirect href="/admin" />;
  return <Redirect href="/auth/login" />;
}

