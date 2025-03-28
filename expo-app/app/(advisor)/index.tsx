import { View, Text, StyleSheet } from 'react-native';

export default function AdvisorDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advisor Dashboard</Text>
      <Text style={styles.subtitle}>Manage your clients and appointments</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});