import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from "react"
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

const logo = require("../../assets/images/logo.png")

type Section = { title: string; items: string[] }

const sections: Section[] = [
  { title: "第1クール", items: ["トップバリュー1", "トップバリュー2"] },
  { title: "第2クール", items: ["まつわか13", "住主", "まつわか3", "富士", "大和島"] },
  { title: "第3クール", items: ["ヤオコー管1", "ヤオコー管2"] },
  { title: "第4クール", items: ["ヤオコー管3", "ヤオコー彩春"] },
  { title: "第5クール", items: ["ヤオコー管4", "自社春久山", "自社国産", "万代恵比寿1"] },
  { title: "第6クール", items: ["ヤオコー管5", "万代恵比寿2"] },
  { title: "第7クール", items: ["ヤオコー管6", "万代恵比寿3"] }
]

function InfoCard({ title, value, sub, tone }: { title: string; value: string; sub?: string; tone?: "green" }) {
  const toneStyle = useMemo(() => {
    if (tone === "green") return { borderColor: "#147D37", backgroundColor: "#147D37" }
    // return { borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }
  }, [tone])
  return (
    <View style={[styles.card, toneStyle]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {!!sub && <Text style={styles.cardSub}>{sub}</Text>}
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function ActionButton({ label, color, onPress }: { label: string; color: "green" | "gray"; onPress: () => void }) {
  const bg = color === "green" ? "#147D37" : color === "gray" ? "#BEBEBE" : "#F8F8F8"
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionBtn, { backgroundColor: bg, opacity: pressed ? 0.9 : 1 }]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  )
}

export default function StaffScreen() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [picked, setPicked] = useState<string | null>(null)
  const [now, setNow] = useState<string>("")
  const { width } = useWindowDimensions()
  const isWide = width >= 1024
  const router = useRouter()
  const {logout} = useAuth()

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      const hh = d.getHours().toString().padStart(2, "0")
      const mm = d.getMinutes().toString().padStart(2, "0")
      const ss = d.getSeconds().toString().padStart(2, "0")
      setNow(`${hh}:${mm}:${ss}`)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const toggle = (title: string) => setExpanded(prev => ({ ...prev, [title]: !prev[title] }))

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={logo} style={{ width: 100, height: 50, resizeMode: "contain" }}/>
          <View>
            <Text style={styles.appTitle}>フルックス管理アプリ</Text>
            <Text style={styles.appSub}>進捗管理</Text>
          </View>

          <Pressable onPress={logout} hitSlop={12} style={({pressed}) => [styles.logoutBtn, pressed && {opacity: 0.85}]}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </Pressable>
        </View>

      </View>

      <View style={[styles.main, { flexDirection: isWide ? "row" : "column" }]}>
        <View style={[styles.sidebar, { width: isWide ? 300 : "100%" }]}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {sections.map(sec => (
              <View key={sec.title} style={{ marginBottom: 16 }}>
                <Pressable onPress={() => toggle(sec.title)} style={styles.sectionHeader}>
                  <Text style={styles.sectionChevron}>{expanded[sec.title] ? "▾" : "▸"}</Text>
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                </Pressable>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {(expanded[sec.title] ?? true) &&
                    sec.items.map(name => (
                      <Pressable
                        key={name}
                        onPress={() => setPicked(name)}
                        style={[styles.pill, { backgroundColor: picked === name ? "#147D37" : "#147D37" }]}
                      >
                        <Text style={styles.pillText}>{name}</Text>
                      </Pressable>
                    ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
          {!picked ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>左のリストから選択してください</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionMainTitle}>{picked}</Text>
              <Text style={styles.sectionDesc}>リアルタイムの生産進捗状況を監視・管理します</Text>

              <View style={[styles.row, { marginTop: 16 }]}>
                <InfoCard title="生産進捗数" value="1,630" sub="セット" tone="green" />
                <InfoCard title="進捗率" value="99.3%" sub="完了" tone="green" />
                <InfoCard title="残数" value="0" sub="セット" tone="green" />
                <InfoCard title="現在時刻" value={now || "—"} tone="green" sub="進行中" />
              </View>

              <View style={[styles.row, { alignItems: "flex-start" }]}>
                <View style={styles.detailCard}>
                  <DetailRow label="商品名" value="TV結" />
                  <DetailRow label="ラインA" value="盛付ライン" />
                  <DetailRow label="予定開始時刻" value="9:30" />
                  <DetailRow label="予定終了時刻" value="16:30" />
                  <DetailRow label="予定通過時刻" value="16:01" />
                </View>

                <View style={styles.detailCard} >
                  <DetailRow label="終了見込時刻" value="12:03" />
                  <DetailRow label="自動カウンター" value="10 セット"/>
                  <DetailRow label="生産進捗数" value="80"/>
                  <DetailRow label="生産進捗率" value="40%"/>
                  <DetailRow label="残数" value="1550 セット"/>
                </View>

                <View style={styles.actionsCol}>
                  <ActionButton label="生産 開始" color="green" onPress={() => Alert.alert("生産開始", "スタートしました")} />
                  <ActionButton label="生産 中断" color="green" onPress={() => Alert.alert("生産中断", "一時停止しました")} />
                  <ActionButton label="生産 再開" color="green" onPress={() => Alert.alert("生産再開", "再開しました")} />
                  <ActionButton label="生産 終了" color="green" onPress={() => Alert.alert("生産終了", "終了しました")} />
                  <ActionButton label="カウンター履歴" color="green" onPress={() => Alert.alert("履歴", "履歴を示します")} />
                </View>
              </View>

              <View style={styles.banner}>
                <ActionButton label="10セット準備OK" color="gray" onPress={() => Alert.alert("準備", "準備完了")} />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  appTitle: { fontSize: 24, fontWeight: "800" },
  appSub: { fontSize: 14, color: "#64748B" },
  main: { flex: 1 },
  sidebar: { backgroundColor: "#FFFFFF", borderRightWidth: 1, borderRightColor: "#E2E8F0" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionChevron: { fontSize: 18, color: "#0F172A" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", backgroundColor: "#BEBEBE", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  pillText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  content: { flex: 1 },
  sectionMainTitle: { fontSize: 22, fontWeight: "800" },
  sectionDesc: { fontSize: 14, color: "#F5F5F5", marginTop: 4 },
  row: { flexDirection: "row", gap: 16, marginTop: 12, flexWrap: "wrap" },
  card: { flexGrow: 1, minWidth: 220, padding: 18, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontSize: 14, color: "#FFFFFF" },
  cardValue: { fontSize: 28, fontWeight: "800", marginTop: 6 },
  cardSub: { fontSize: 12, color: "#FFFFFF", marginTop: 2 },
  detailCard: { flex: 1, minWidth: 420, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#FFFFFF", padding: 18 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#FFFFFF" },
  detailLabel: { fontSize: 16, color: "#334155", fontWeight: "600" },
  detailValue: { fontSize: 16, color: "#0F172A", fontWeight: "700" },
  actionsCol: { width: 260, gap: 12 },
  actionRow:  { width: 260, gap: 20},
  actionBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  actionText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  empty: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#FFFFFF", padding: 28, alignItems: "center", justifyContent: "center", minHeight: 260 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  banner: { marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, alignSelf: "stretch" },
  bannerText: { color: "#FFFFFF", textAlign: "center", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  brandRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  logoutText: {color: '#fff', fontWeight: '700'},
  logoutBtn: {paddingHorizontal: 20, paddingVertical: 10, marginLeft: 'auto', backgroundColor: '#147d37', borderRadius: 999}
})
