import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from "react"
import { Image, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, useWindowDimensions, View } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context'

const logo = require("../../assets/images/logo.png")

const PC_IP = "192.168.62.133";

const API_BASE = Platform.select({
  web: "http://127.0.0.1:3000",     
  ios: `http://${PC_IP}:3000`,       
  android: `http://${PC_IP}:3000`,   
  default: `http://${PC_IP}:3000`,
});

const LINES = ['Aライン', 'Bライン', 'Cライン', 'Dライン', 'Eライン', 'Fライン'];

type Section = { title: string; items: string[] }

const sections: Section[] = [
  { title: "第1クール", items: ["TV結1", "TV結2"] },
  { title: "第2クール", items: ["まつおか1.3", "佳宝", "まつおか3", "富士", "大和路"] },
  { title: "第3クール", items: ["ヤオコー誉1", "ヤオコー誉2"] },
  { title: "第4クール", items: ["ヤオコー誉3", "ヤオコー彩春"] },
  { title: "第5クール", items: ["ヤオコー誉4", "自社香久山", "自社国産", "万代恵比寿1"] },
  { title: "第6クール", items: ["ヤオコー誉5", "万代恵比寿2"] },
  { title: "第7クール", items: ["ヤオコー誉6", "万代恵比寿3"] }
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

function DetailRow({ label, value, labelStyle, valueStyle }: { label: string; value: string; labelStyle?: StyleProp<TextStyle>; valueStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, labelStyle]}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  )
}

function ActionButton({ label, color, onPress, disabled }: { label: string; color: "green" | "red"; onPress: () => void; disabled?: boolean }) {
  const bg = color === "green" ? "#147D37" : color === "red" ? "#ef0c0cff" : "#F8F8F8"
  return (
    <Pressable onPress={onPress} disabled={!!disabled} style={({ pressed }) => [styles.actionBtn, { backgroundColor: bg, opacity: disabled ? 0.5 : (pressed ? 0.9 : 1) }]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function ActionLine({ label, color, onPress, ts, note }: {label: string; color: 'green'; onPress: () => void, ts?: string, note?: string}) {
  return (
    <View style={styles.actionLine}>
      <ActionButton label={label} color='green' onPress={onPress} />
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{ts ?? "-"}</Text>
        {!!note && <Text style={styles.noteText}>{note}</Text>}
      </View>
    </View>
  );
}

export default function StaffScreen() {
  type ActionTime =
  {
    start?: string;
    pause?: string;
    resume?: string;
    finish?: string;
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [picked, setPicked] = useState<string | null>(null)
  const [now, setNow] = useState<string>("")
  const [target, setTarget] = useState<number>(1630)
  const [done, setDone] = useState<number>(0)
  const remaining = Math.max(target - done, 0)
  const progress = target > 0 ? (done / target) : 0
  const [bannerMessage, setBannerMessage] = useState("")
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [actionTimes, setActionTimes] = useState<Record<string, ActionTime>>({});
  const [finishNote, setFinishNote] = useState<string | undefined>();
  const [paused, setPaused] = useState(false);
  const [sending, setSending] = useState(false);
  const [current, setCurrent] = useState<{ totalTarget: number; 
                                           produced: number; 
                                           remaining: number; 
                                           progressPct: number;
                                           productName?: string | null;
                                           plannedStartTime?: string | null;
                                           plannedEndTime?: string | null;
                                           plannedPassTime?: string | null;
                                           expectedFinishTime?: string | null;
                                           status?: string; }|null>(null);

  const canPrep = !paused && (current?.remaining ?? 0) > 0;
  const [line, setLine] = useState<string>('Aライン');

  const key = picked ? `${line}__${picked}` : '';
  const actionTime: ActionTime = key && actionTimes[key] ? actionTimes[key] : {};

  async function loadCurrent() 
  {
    if (!picked)
    {
      setCurrent(null);
      setTarget(0);
      setDone(0);
      setPaused(false);
      return;
    }

    const product = `?product=${encodeURIComponent(picked)}`;
    const url = `${API_BASE}/staff/lines/${encodeURIComponent(line)}/current${product}`;
    const r = await fetch(url);

    if (r.status === 404)
    {
      setCurrent(null);
      setTarget(0);
      setDone(0);
      setPaused(false);
      return;
    }

    if (!r.ok) throw new Error(await r.text());

    const j = await r.json();
    setCurrent(j);
    setTarget(j.totalTarget ?? 0);
    setDone(j.produced ?? 0);
    setPaused(j.status === 'paused');
  }

  async function action(type: 'start'|'pause'|'resume'|'finish') 
  {
    if (!picked) 
    {
      alert('左のリストから商品を選択してください');
      return {ok: false, noop: true};
    }
    const r = await fetch(`${API_BASE}/staff/lines/${encodeURIComponent(line)}/actions/${type}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({product: picked}) });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) 
    {
      if (data?.message === 'no active task') return { ok: true, noop: true };
      throw new Error(data?.message || `HTTP ${r.status}`);
    }
    return data;
  }


  async function manual(delta: number) 
  {
    if (!picked) return;

    try {
      const r = await fetch(`${API_BASE}/staff/lines/${encodeURIComponent(line)}/counters/manual`, 
      {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ delta, product: picked })
      });

      if (!r.ok) 
      {
        let j: any = {};
        try { j = await r.json(); } catch {}
        if (j?.message === 'paused') 
        {
          alert('中断中：先に「生産 再開」を押してください');
          return;
        }
        if (j?.message === 'finished') 
        {
          alert('このタスクは終了しました');
          return;
        }
        throw new Error(j?.message || `HTTP ${r.status}`);
      }
    } finally { await loadCurrent().catch(()=>{}); }
  }


  useEffect(() => { 
    if (!picked) return; 
    
    const run = () => {
      loadCurrent().catch(() => {});
    };

    run();

    const timer = setInterval(run, 5000);
    return () => clearInterval(timer);
  }, [line, picked]);

  const flash = (text: string) => {
    setBannerMessage(text)
    if (hideRef.current) clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => setBannerMessage(""), 1000)
  }
  useEffect(() => () => { if(hideRef.current) clearTimeout(hideRef.current) }, [])

  const stamp = () => {
    const day = new Date()
    const hour = day.getHours().toString().padStart(2, '0')
    const minute = day.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  }

  const mark = (k: keyof ActionTime, cb?: () => void) => () => {
    if (!key) return;
    setActionTimes(prev => {
      const prevForKey = prev[key] || {};
      return {
        ...prev,
        [key]: { ...prevForKey, [k]: stamp() }
      };
    });
    cb?.();
  } 

  const NO_DATA = '_';
  const hasTask = !!current;
  const fmtNum = (n: number) => n.toLocaleString('ja-JP')
  const fmtPercentage = (p: number) => `${Math.round(p * 1000) /10}%`
  const fmtTime = (t?: string | null) => t ? t.slice(0, 5) : NO_DATA;
  const { width } = useWindowDimensions()
  const isWeb = width >= 1024
  const isIpad = width >= 768
  const router = useRouter()
  const {logout} = useAuth()

  const onPrepOK = async () => 
  {
    if (!canPrep) 
    {
      alert(paused ? '中断中：先に「生産 再開」を押してください' : 'このタスクは終了しました');
      return;
    }
    try 
    {
      await manual(10);            
      flash('準備OK');              
      await loadCurrent().catch(() => {});
    } catch {}
  };


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
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={logo} style={{ width: 100, height: 50, resizeMode: "contain" }}/>
          <View>
            <Text style={styles.appTitle}>おせち進捗管理</Text>
          </View>

          <Pressable onPress={logout} hitSlop={12} style={({pressed}) => [styles.logoutBtn, pressed && {opacity: 0.85}]}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lineBarContent}>
          {LINES.map(l => {
            const selected = line === l;
            return (            
              <Pressable key={l} onPress={() => {
                setLine(l); setPicked(null); setTarget(0); setDone(0); setPaused(false); setFinishNote(undefined); setBannerMessage(""); }} 
                style={[styles.lineChip, selected && styles.lineChipActive]}>

                  <Text style={[styles.lineChipText, selected && styles.lineChipTextActive]}>{l}</Text>
              </Pressable>
              );
            })}
        </ScrollView>

      </View>

      <View style={[styles.main, { flexDirection: isIpad ? "row" : "column" }]}>
        <View style={[styles.sidebar, { width: isIpad ? 160 : "100%" }]}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {sections.map(sec => (
              <View key={sec.title} style={{ marginBottom: 16 }}>
                <Pressable onPress={() => toggle(sec.title)} style={styles.sectionHeader}>
                  <Text style={styles.sectionArrow}>{expanded[sec.title] ? "▾" : "▸"}</Text>
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                </Pressable>
                <View style={{ gap: 10, marginTop: 10 }}>
                  {(expanded[sec.title] ?? true) &&
                    sec.items.map(name => (
                      <Pressable
                        key={name}
                        onPress={() => { setPicked(name); setFinishNote(undefined); setBannerMessage(""); }}
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

              <View style={[styles.row, { marginTop: 16 }]}>
                <InfoCard title="合計数" value={hasTask ? fmtNum(target) : NO_DATA} sub="セット" tone="green" />
                <InfoCard title="進捗率" value={hasTask ? fmtPercentage(progress) : NO_DATA} sub="完了" tone="green" />
                <InfoCard title="残数" value={hasTask ? fmtNum(remaining) : NO_DATA} sub="セット" tone="green" />
                <InfoCard title="現在時刻" value={now || "—"} tone="green" sub="進行中" />
              </View>

              <View style={[styles.row, { alignItems: "flex-start" }]}>
                <View style={styles.detailCard}>
                  <DetailRow label="商品名" value={current?.productName || picked || NO_DATA} />
                  <DetailRow label="盛付ライン" value={line} />
                  <DetailRow label="予定開始時刻" value={fmtTime(current?.plannedStartTime) ?? '-'} />
                  <DetailRow label="予定終了時刻" value={fmtTime(current?.plannedEndTime) ?? '-'} />
                  <DetailRow label="予定通過時刻" value={fmtTime(current?.plannedPassTime) ?? '-'} />
                </View>

                <View style={styles.detailCard} >
                  <DetailRow label="終了見込時刻" value={fmtTime(current?.expectedFinishTime) ?? '-'} labelStyle={{color: "#eb053eff" }} valueStyle={{color: "#eb053eff"}}/>
                  <DetailRow label="生産進捗率" value={hasTask ? fmtPercentage(progress) : NO_DATA} labelStyle={{color: "#eb053eff" }} valueStyle={{color: "#eb053eff"}}/>
                  <DetailRow label="自動カウンター" value="10 セット" />
                  <DetailRow label="生産進捗数" value={hasTask ? fmtNum(done) : NO_DATA} /> 
                  <DetailRow label="残数" value={hasTask ? fmtNum(remaining) : NO_DATA} />
                </View>
              </View>

              <View style={styles.actionsCol}>
                <ActionLine label="生産 開始"  color="green" ts={actionTime.start}  onPress={async () => { mark('start')(); const r = await action('start'); if (!r?.noop) { setPaused(false); setFinishNote(undefined); setDone(0); await loadCurrent().catch(() => {}); } }} />
                <ActionLine label="生産 中断"  color="green" ts={actionTime.pause}  onPress={async () => { mark('pause')(); const r = await action('pause'); if(r?.ok) { setPaused(true); await loadCurrent().catch(() => {}); } }} />
                <ActionLine label="生産 再開"  color="green" ts={actionTime.resume} onPress={async () => { mark('resume')(); const r = await action('resume'); if(r?.ok) { setPaused(false); await loadCurrent().catch(() => {}); } }} />
                <ActionLine label="生産 終了"  color="green" ts={actionTime.finish} note={finishNote} onPress={async () => { mark('finish')(); await action('finish'); setFinishNote('生産終了しました！'); setTimeout(() => setFinishNote(undefined), 3000); await loadCurrent().catch(() => {}); }} />
                <ActionLine label="カウンター履歴" color="green" onPress={() => router.push({pathname: '/staff/explore', params: {line, product: picked || ''} })} />
              </View>

              <View style={styles.banner}>
                <ActionButton label="10セット準備OK" color="red" disabled={!canPrep || sending} onPress={onPrepOK} />
                <View style={styles.bannerMessage}>
                  <Text style={styles.bannerMsgText}>{bannerMessage || " "}</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#F1F5F9" 
  },
  header: { 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    backgroundColor: "#FFFFFF", 
    borderBottomWidth: 1, 
    borderBottomColor: "#E2E8F0" 
  },
  appTitle: { 
    fontSize: 24, 
    fontWeight: "800" 
  },
  main: { flex: 1 },
  sidebar: { 
    backgroundColor: "#FFFFFF", 
    borderRightWidth: 1, 
    borderRightColor: "#E2E8F0" 
  },
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  sectionArrow: { 
    fontSize: 18, 
    color: "#0F172A" 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#0F172A", 
    backgroundColor: "#BEBEBE", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 999 
  },
  pill: { 
    alignSelf: "flex-start", 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 999 
  },
  pillText: { 
    color: "#FFFFFF", 
    fontSize: 14, 
    fontWeight: "700" 
  },
  content: { flex: 1 },
  sectionMainTitle: { 
    fontSize: 22, 
    fontWeight: "800" 
  },
  sectionDesc: { 
    fontSize: 14, 
    color: "#F5F5F5", 
    marginTop: 4 
  },
  row: { 
    flexDirection: "row", 
    gap: 16, 
    marginTop: 12, 
    flexWrap: "wrap" 
  },
  card: { 
    flexGrow: 1, 
    minWidth: 220, 
    padding: 18, 
    borderRadius: 16, 
    borderWidth: 1 
  },
  cardTitle: { 
    fontSize: 14, 
    color: "#FFFFFF" 
  },
  cardValue: { 
    fontSize: 28, 
    fontWeight: "800", 
    marginTop: 6 
  },
  cardSub: { 
    fontSize: 12, 
    color: "#FFFFFF", 
    marginTop: 2 
  },
  detailCard: { 
    flex: 1, 
    minWidth: 420, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#FFFFFF", 
    padding: 18 
  },
  detailRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#FFFFFF" 
  },
  detailLabel: { 
    fontSize: 16, 
    color: "#334155", 
    fontWeight: "600" 
  },
  detailValue: { 
    fontSize: 16, 
    color: "#0F172A", 
    fontWeight: "700" 
  },
  actionsCol: { 
    marginTop: 16, 
    width: 300, 
    gap: 12 }
    ,
  actionRow:  { 
    width: 260, 
    gap: 20
  },
  actionBtn: { 
    width: 200, 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: "center" 
  },
  actionText: { 
    color: "#FFFFFF", 
    fontSize: 18, 
    fontWeight: "800", 
    letterSpacing: 0.5 
  },
  empty: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#FFFFFF", 
    padding: 28, 
    alignItems: "center", 
    justifyContent: "center", 
    minHeight: 260 
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#0F172A" 
  },
  banner: { 
    marginTop: 16, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    paddingVertical: 18, 
    paddingHorizontal: 16, 
    alignSelf: "stretch",
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 
  },
  bannerText: { 
    color: "#FFFFFF", 
    textAlign: "center", 
    fontSize: 18, 
    fontWeight: "900", 
    letterSpacing: 0.5 
  },
  brandRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12
  },
  logoutText: {
    color: '#fff', 
    fontWeight: '700'
  },
  logoutBtn: {
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    marginLeft: 'auto', 
    backgroundColor: '#147d37', 
    borderRadius: 999
  },
  actionLine: {
    width: 400, 
    flexDirection: 'row', 
    gap: 12, 
    alignItems: 'stretch'
  },
  timeBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  timeText: {
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0f172a', 
    letterSpacing: 0.5
  },
  bannerMessage: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minHeight: 56
  },
  bannerMsgText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ec2e0cff',
    letterSpacing: 0.5
  },
  noteText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: '#ec2e0c',
    letterSpacing: 0.5
  },
  lineBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8
  },
  lineBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8
  },
  lineChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#147d37',
    backgroundColor: '#ffffff',
    marginRight: 4
  },
  lineChipActive: {
    backgroundColor: '#147d37',
  },
  lineChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#147d37'
  },
  lineChipTextActive: {
    color: '#ffffff'
  }
})
