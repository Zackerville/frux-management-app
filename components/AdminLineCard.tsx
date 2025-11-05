import { StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  lineTitle: string;
  productTitle: string;

  plannedDate: string;
  plannedTime: string;
  expectedDate: string;
  expectedTime: string;

  targetCount: string;
  manualCount: string;
  autoCount: string;

  onChangePlannedDate?: (v: string) => void;
  onChangePlannedTime?: (v: string) => void;
  onChangeExpectedDate?: (v: string) => void;
  onChangeExpectedTime?: (v: string) => void;
  onChangeTarget?: (v: string) => void;
  onChangeManual?: (v: string) => void;
  onChangeAuto?: (v: string) => void;
};

export default function AdminLineCard(p: Props) {
  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <View style={[s.titleBox, { marginRight: 24 }]}>
          <Text style={s.titleText}>{p.lineTitle}</Text>
        </View>
        <View style={[s.titleBox, { marginLeft: 24 }]}>
          <Text style={s.titleText}>{p.productTitle}</Text>
        </View>
      </View>

      <View style={s.bodyRow}>
        <View style={[s.col, { marginRight: 24 }]}>
          <Text style={s.blockLabel}>予定終了時刻</Text>
          <TextInput
            value={p.plannedDate}
            onChangeText={p.onChangePlannedDate}
            style={[s.greenBox, s.boxWide]}
            placeholder="YYYY/MM/DD"
            placeholderTextColor="#e6f3ea"
          />
          <TextInput
            value={p.plannedTime}
            onChangeText={p.onChangePlannedTime}
            style={[s.greenBox, s.boxWide]}
            placeholder="HH:mm"
            placeholderTextColor="#e6f3ea"
          />

          <Text style={[s.blockLabel, { marginTop: 28 }]}>生産指示数</Text>
          <TextInput
            value={p.targetCount}
            onChangeText={p.onChangeTarget}
            keyboardType="numeric"
            style={[s.greenBox, s.boxWideNumber]}
          />
        </View>

        <View style={[s.col, { marginLeft: 24 }]}>
          <Text style={s.blockLabel}>終了見込時刻</Text>
          <TextInput
            value={p.expectedDate}
            onChangeText={p.onChangeExpectedDate}
            style={[s.greenBox, s.boxWide]}
            placeholder="YYYY/MM/DD"
            placeholderTextColor="#e6f3ea"
          />
          <TextInput
            value={p.expectedTime}
            onChangeText={p.onChangeExpectedTime}
            style={[s.greenBox, s.boxWide]}
            placeholder="HH:mm"
            placeholderTextColor="#e6f3ea"
          />

          <Text style={[s.blockLabelBig, { marginTop: 28 }]}>現在生産数</Text>
          <View style={s.redNoteRow}>
            <Text style={s.redNote}>トップカウント(手動)</Text>
            <Text style={s.redNote}>エンドカウント(自動)</Text>
          </View>

          <View style={s.dualRow}>
            <TextInput
              value={p.manualCount}
              onChangeText={p.onChangeManual}
              keyboardType="numeric"
              style={[s.greenBox, s.boxSmallNumber, { marginRight: 18 }]}
            />
            <TextInput
              value={p.autoCount}
              onChangeText={p.onChangeAuto}
              keyboardType="numeric"
              style={[s.greenBox, s.boxSmallNumber, { marginLeft: 18 }]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const GREEN = "#147D37";

const s = StyleSheet.create({
  card: {
    backgroundColor: "#E3E3E3",
    borderRadius: 12,
    padding: 24,
    width: 700,
    alignSelf: "center"
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  titleBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center"
  },
  titleText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#111"
  },
  bodyRow: {
    flexDirection: "row",
    marginTop: 8
  },
  col: {
    flex: 1
  },
  blockLabel: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F0F0F",
    marginBottom: 8
  },
  blockLabelBig: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F0F0F",
    textAlign: "center"
  },
  greenBox: {
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    color: "white",
    textAlign: "center"
  },
  boxWide: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12
  },
  boxWideNumber: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2
  },
  redNoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 8
  },
  redNote: {
    color: "#C93333",
    fontSize: 12,
    fontWeight: "700"
  },
  dualRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  boxSmallNumber: {
    flex: 1,
    fontSize: 26,
    fontWeight: "900",
    paddingVertical: 10
  }
});
