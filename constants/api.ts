import { Platform } from "react-native";
export const API_BASE =
  Platform.select({ web: "http://localhost:3001", ios: "http://localhost:3001", android: "http://10.0.2.2:3001", default: "http://localhost:3001" })!;
export const LINE_NAME = "Aライン";
