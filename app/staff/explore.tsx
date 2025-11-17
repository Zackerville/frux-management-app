import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

const PC_IP = "192.168.62.133";

const API_BASE = Platform.select({
  web: "http://127.0.0.1:3000",     
  ios: `http://${PC_IP}:3000`,      
  android: `http://${PC_IP}:3000`,   
  default: `http://${PC_IP}:3000`,
});


const DEFAULT_LINE = "Aライン"

type Row = {
  生産数: number | null
  通過時刻: string | null
  予定通過時刻: string | null
  残数: number | null
  開始時刻: string | null
  終了時刻: string | null
  中断時刻: string | null
  再開時刻: string | null
}

function ftime(s?: string | null) {
  if (!s) return "";
  // Backend đã trả sẵn "HH:mm" → trả nguyên
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  return String(s);
}


function fnum(n: number | null) {
  if (n == null) return ""
  return n.toLocaleString("ja-JP")
}


export default function CounterHistory() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState<string>("")
  const params = useLocalSearchParams<{ line?: string; product?: string }>();
  const line_name = typeof params.line === 'string' && params.line ? params.line : DEFAULT_LINE;
  const product_name = typeof params.product === 'string' && params.product ? params.product : "";

  const load = useCallback(async () => {
    try {
      let url = `${API_BASE}/staff/lines/${encodeURIComponent(line_name)}/counter-history?limit=100`;
      if (product_name)
        url += `&product=${encodeURIComponent(product_name)}`;
      
      const r = await fetch(url);
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      setRows(await r.json())
      setErr("")
    } catch(e: any) { setErr(String(e.message || e)) }
  }, [line_name, product_name]);

  useFocusEffect(useCallback(() => { load(); },[load]));

  // useEffect(() => {
  //   const run = async () => {
  //     try {
  //       const r = await fetch(`${API_BASE}/staff/lines/${encodeURIComponent(LINE_NAME)}/counter-history?limit=100`)
  //       if (!r.ok) throw new Error(`HTTP ${r.status}`)
  //       setRows(await r.json())
  //     } catch (e: any) {
  //       setErr(String(e.message || e))
  //     }
  //   }
  //   run()
  // }, [])

  if (err) return <View style={S.root}><Text style={S.title}>エラー: {err}</Text></View>
  if (!rows) return <View style={S.root}><ActivityIndicator /></View>

  return (
    <View style={S.root}>
      <View style={S.bar}>
        <Text style={S.title}>カウント履歴</Text>
      </View>
      <ScrollView horizontal>
        <View>
          <View style={[S.row, S.head]}>
            <Text style={[S.cell, S.h]}>生産数</Text>
            <Text style={[S.cell, S.h]}>通過時刻</Text>
            <Text style={[S.cell, S.h, { width: 140 }]}>予定通過時刻</Text>
            <Text style={[S.cell, S.h]}>残数</Text>
            <Text style={[S.cell, S.h]}>開始時刻</Text>
            <Text style={[S.cell, S.h]}>終了時刻</Text>
            <Text style={[S.cell, S.h]}>中断時刻</Text>
            <Text style={[S.cell, S.h]}>再開時刻</Text>
          </View>
          <ScrollView style={{ maxHeight: 520 }}>
            {rows.map((r, i) => (
              <View key={i} style={S.row}>
                <Text style={S.cell}>{fnum(r.生産数)}</Text>
                <Text style={S.cell}>{ftime(r.通過時刻)}</Text>
                <Text style={[S.cell, { width: 140 }]}>{ftime(r.予定通過時刻)}</Text>
                <Text style={S.cell}>{fnum(r.残数)}</Text>
                <Text style={S.cell}>{ftime(r.開始時刻)}</Text>
                <Text style={S.cell}>{ftime(r.終了時刻)}</Text>
                <Text style={S.cell}>{ftime(r.中断時刻)}</Text>
                <Text style={S.cell}>{ftime(r.再開時刻)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, padding: 16, backgroundColor: "#F1F5F9" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  head: { backgroundColor: "#E5E7EB" },
  cell: { width: 120, paddingVertical: 10, paddingHorizontal: 8, fontSize: 16, fontWeight: "600" },
  h: { fontWeight: "800" },
  bar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  back: { fontSize: 16, fontWeight: "700", color: "#2563EB" },
})
