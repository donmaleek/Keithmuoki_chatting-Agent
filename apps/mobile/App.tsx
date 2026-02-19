import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chatting Agent</Text>
      <Text style={styles.subtitle}>Mobile inbox and notifications</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f4ef',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#4b5563'
  }
});
