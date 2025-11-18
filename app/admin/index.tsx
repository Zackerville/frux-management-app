import { useAuth } from '@/providers/AuthProvider';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const PC_IP = "192.168.62.133";

const API_BASE = Platform.select({
  web: "http://127.0.0.1:3000",     
  ios: `http://${PC_IP}:3000`,       
  android: `http://${PC_IP}:3000`,   
  default: `http://${PC_IP}:3000`,
});

type Line = {
  id: string
  title: string
  product?: string
  plannedEnd: Date
  etaEnd: Date
  target: number
  manualCount: number
  autoCount: number
}
const logo = require('../../assets/images/logo.png')

const initLines: Line[] = [
  { id: 'A', title: 'Aライン', product: '', plannedEnd: new Date(), etaEnd: new Date(), target: 0, manualCount: 0, autoCount: 0 },
  { id: 'B', title: 'Bライン', product: '', plannedEnd: new Date(), etaEnd: new Date(), target: 0, manualCount: 0, autoCount: 0 },
  { id: 'C', title: 'Cライン', product: '', plannedEnd: new Date(), etaEnd: new Date(), target: 0, manualCount: 0, autoCount: 0 },
  { id: 'D', title: 'Dライン', product: '', plannedEnd: new Date(), etaEnd: new Date(), target: 0, manualCount: 0, autoCount: 0 },
  { id: 'E', title: 'Eライン', product: '', plannedEnd: new Date(), etaEnd: new Date(), target: 0, manualCount: 0, autoCount: 0 },
  { id: 'F', title: 'Fライン', product: '', plannedEnd: new Date(), etaEnd: new Date(), target: 0, manualCount: 0, autoCount: 0 },
]


const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

function GreenInputWeb(p: any) {
  return (
    // @ts-ignore
    <input
      {...p}
      style={{
        width: '90%',
        height: 36,
        borderRadius: 10,
        border: 0,
        padding: '0 10px',
        background: '#147D37',
        color: '#fff',
        fontWeight: 800,
        textAlign: 'center',
        outline: 'none',
      }}
    />
  )
}

function DateFieldStack({ value, onChange, readOnly = false }: { value: Date; onChange: (d: Date) => void; readOnly?: boolean }) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ gap: 8 }}>
        <GreenInputWeb
          type="date"
          value={ymd(value)}
          onChange={(e: any) => {
            if (readOnly) return
            const [Y, M, D] = e.target.value.split('-').map(Number)
            const n = new Date(value)
            n.setFullYear(Y)
            n.setMonth(M - 1)
            n.setDate(D)
            onChange(n)
          }}
          readOnly={readOnly}
        />
        <GreenInputWeb
          type="time"
          value={hm(value)}
          onChange={(e: any) => {
            if (readOnly) return
            const [H, m] = e.target.value.split(':').map(Number)
            const n = new Date(value)
            n.setHours(H)
            n.setMinutes(m)
            onChange(n)
          }}
          readOnly={readOnly}
        />
      </View>
    )
  }
  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={ymd(value)}
        onChangeText={(txt) => {
          const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt)
          if (m) {
            const n = new Date(value)
            n.setFullYear(Number(m[1]))
            n.setMonth(Number(m[2]) - 1)
            n.setDate(Number(m[3]))
            onChange(n)
          }
        }}
        style={[styles.inputGreen, { textAlign: 'center', fontWeight: '800' }]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#fff"
      />
      <TextInput
        value={hm(value)}
        onChangeText={(txt) => {
          const m = /^(\d{2}):(\d{2})$/.exec(txt)
          if (m) {
            const n = new Date(value)
            n.setHours(Number(m[1]))
            n.setMinutes(Number(m[2]))
            onChange(n)
          }
        }}
        style={[styles.inputGreen, { textAlign: 'center', fontWeight: '800' }]}
        placeholder="HH:mm"
        placeholderTextColor="#fff"
      />
    </View>
  )
}

function Meter({ value, max }: { value: number; max: number }) {
  const ratio = useMemo(() => {
    if (max <= 0) return 0
    return Math.max(0, Math.min(1, value / max))
  }, [value, max])
  return (
    <View style={styles.meterTrack}>
      <View style={[styles.meterFill, { width: `${ratio * 100}%` }]} />
    </View>
  )
}

function LineCard({ line, onChange }: { line: Line; onChange: (next: Line) => void }) {
  const { id, title,  plannedEnd, etaEnd, target, manualCount, autoCount } = line
  const set = (patch: Partial<Line>) => onChange({ ...line, ...patch })
  const total = manualCount + autoCount
    return (
    <View style={styles.card}>
      <View style={styles.cardBanner}>
  <Text style={styles.bannerPill}>{title}</Text>

  <TextInput
  value={line.product || ""}
  editable={false}
  style={{
    width: 150,       
    marginLeft: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000',
    fontSize: 25
  }}

/>

</View>


      <View style={styles.cols}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>予定終了時刻</Text>
          <DateFieldStack value={plannedEnd} onChange={() => {}} readOnly={true} />
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>生産指示数</Text>
          <TextInput
            value={String(target)}
            editable={false}  // <-- chỉ đọc
            style={styles.inputGreen}
          />
          <Meter value={total} max={Math.max(1, target)} />
        </View>

        <View style={styles.col}>
        <Text style={styles.sectionTitle}>終了見込時刻</Text>
        <DateFieldStack value={etaEnd} onChange={(d) => set({ etaEnd: d })} readOnly={true} />

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>現在生産数</Text>
          <View style={styles.countRow}>
            <View style={styles.countBox}>
              <Text style={styles.countHint}>トップカウント(手動)</Text>
              <TextInput
                value={String(manualCount)}
                editable={false}  // <-- chỉ đọc
                style={[styles.inputGreen, styles.countInput]}
              />
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countHint}>エンドカウント(自動)</Text>
              <TextInput
                value={String(autoCount)}
                editable={false}  // <-- chỉ đọc
                style={[styles.inputGreen, styles.countInput]}
              />
            </View>
          </View>
          <Meter value={total} max={Math.max(1, target)} />
        </View>
      </View>


    </View>
  )
}

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [lines, setLines] = useState<Line[]>(initLines)

  useEffect(() => {
    const fetchAllLines = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/lines`);
        const apiLines = await res.json();
  
        // Map API -> UI format
        const mapped = initLines.map((ln) => {
          const found = apiLines.find((x) => x.lineId === ln.id);
  
          if (!found) return ln;
  
          return {
            ...ln,
            product: found.product || "",
            plannedEnd: found.plannedEnd ? new Date(found.plannedEnd) : new Date(),
            etaEnd: found.etaEnd ? new Date(found.etaEnd) : new Date(),
            target: found.total ?? 0,
            manualCount: found.productionCount ?? 0,
            autoCount: 0, // Nếu sau này backend trả thêm thì map vào
          };
        });
  
        setLines(mapped);
      } catch (err) {
        console.log("Fetch error:", err);
      }
    };
  
    fetchAllLines();
  }, []);
  
  const update = (i: number, next: Line) => {
    const copy = [...lines];
    copy[i] = next;
    setLines(copy);
  };  // <-- Đóng hàm update ở đây
  
  
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={logo} style={{ width: 92, height: 44, resizeMode: 'contain' }} />
          <Text style={styles.factory}>~2025年度おせち生産進捗見える化</Text>
          <Pressable onPress={logout} hitSlop={12} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.9 }]}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
      {lines.map((ln, i) => (
  <LineCard key={ln.id} line={ln} onChange={(n) => update(i, n)} />
))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', padding: 12 },
  header: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  factory: { flex: 1, fontSize: 26, fontWeight: '600', marginRight: 'auto', textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start' },

  card: {
    backgroundColor: '#d9d9d9',
    borderRadius: 16,
    padding: 12,
    width: '31.5%',
    minWidth: 300,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bannerPill: { backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, fontSize: 22, fontWeight: '800' },

  cols: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },

  inputGreen: { height: 36, borderRadius: 10, borderWidth: 0, paddingHorizontal: 10, backgroundColor: '#147D37', color: '#fff', fontSize: 16 },

  meterTrack: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, marginTop: 6 },
  meterFill: { height: 8, backgroundColor: '#147D37', borderRadius: 999 },

  countRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  countBox: { flex: 1 },
  countHint: { color: '#c81e1e', fontSize: 10, textAlign: 'center', marginBottom: 4, fontWeight: '700' },
  countInput: { textAlign: 'center', fontWeight: '800' },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  smallMuted: { fontSize: 12, color: '#6b7280', fontWeight: '600' },

  logoutText: { color: '#fff', fontWeight: '700' },
  logoutBtn: { paddingHorizontal: 16, paddingVertical: 8, marginLeft: 'auto', backgroundColor: '#147d37', borderRadius: 999 },
})