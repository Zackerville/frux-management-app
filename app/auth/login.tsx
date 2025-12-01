// app/auth/login.tsx
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';

const GREEN = '#157f3d';

export default function Login() {
  const router = useRouter();
  const { signInAsStaff } = useAuth(); 

  const goAdmin = () => router.push('/auth/admin_login');

  const startStaff = async () => {
    await signInAsStaff();
  };

  return (
    <View style={styles.screen}>

      <View style={styles.card}>
        <View style={styles.row}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.factory}>おせち製造</Text>

          <Pressable onPress={goAdmin} style={styles.primaryBtn}>
            <Text style={styles.primaryTxt}>ログイン</Text>
          </Pressable>
        </View>

        <View style={styles.centerCol}>
          <Pressable onPress={startStaff} style={[styles.primaryBtn, styles.wideBtn]}>
            <Text style={styles.primaryTxt}>スタート</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    textAlign: 'center', 
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { fontSize: 60, width: 250, height: 90 },
  factory: {
    fontSize: 50, 
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  lineTitle: { fontSize: 50, fontWeight: '700', marginBottom: 4 },
  wideBtn: { minWidth: 140 },
});
