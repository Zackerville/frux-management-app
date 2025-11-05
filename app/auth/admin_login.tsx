import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

const GREEN = '#157F3D'
const CARD = '#E6E6E6'

export default function AdminLogin() {
    const router = useRouter();
    const {signInAsAdmin} = useAuth();

    const returnLogin = () => router.push('/auth/login');
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const {width} = useWindowDimensions()
    const cardWidth = Math.min(960, width - 48)

    const startAdmin = async () => {
        await signInAsAdmin();
        router.replace('/admin');
    };

    return (
        <View style={styles.screen}>
          <View style={styles.header}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode='contain' />
            <Text style={styles.factory}>ADMIN ログイン</Text>
            <Pressable onPress={returnLogin} style={styles.primaryBtn}>
                <Text style={styles.primaryTxt}>戻す</Text>
            </Pressable>
          </View>

          <View style={[styles.card, { width: cardWidth }]}>
            <View style={[styles.FieldRow, {marginBottom: 16}]}>
                <Text style={styles.label}>アカウント</Text>
                <View style={styles.inputTxt}>
                    <TextInput style={styles.input} placeholder='入力してください' placeholderTextColor='#E6F4EA' value={account} onChangeText={setAccount} autoCapitalize='none' />
                </View>
            </View>

            <View style={[styles.FieldRow, {marginBottom: 8}]}>
                <Text style={styles.label}>パスワード</Text>
                <View style={styles.inputTxt}>
                    <TextInput style={styles.input} placeholder='入力してください' placeholderTextColor='#E6F4EA' value={password} onChangeText={setPassword} autoCapitalize='none' />
                </View>
            </View>


            <View style={styles.center}>
                <Pressable onPress={startAdmin} style={styles.loginBtn}>
                    <Text style={styles.loginTxt}>ログイン</Text>
                </Pressable>
            </View>
          </View>
        </View>
    )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    paddingTop: 24,
    paddingHorizontal: 16,
  },

  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    textAlign: 'center', 
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },

  card: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: CARD,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: { fontSize: 60, width: 250, height: 150 },

  factory: {
    flex: 1,
    fontSize: 50, 
    fontWeight: '600',
    marginRight: 'auto',
    textAlign: 'center',
  },

  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginTop: 'auto',
  },

  primaryTxt: {
    color: '#fff', 
    fontSize: 60,
    fontWeight: '600',
  },

  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  
  FieldRow: {flexDirection: 'row', alignItems: 'center', gap: 24},
  lineTitle: { fontSize: 50, fontWeight: '700', marginBottom: 4 },
  wideBtn: { minWidth: 140 },
  label: { width: 110, fontSize: 16, color: '#222', textAlign: 'right', marginRight: 18 },
  inputTxt: { flex: 1, backgroundColor: GREEN, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 10 },
  input: { color: "#FFFFFF", fontSize: 16, height: 40 },
  center: { alignItems: "center", gap: 14, marginTop: 10 },
  loginBtn: { backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 18, paddingVertical: 10 },
  loginTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
