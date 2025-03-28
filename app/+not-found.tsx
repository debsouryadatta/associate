import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Chrome as Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorCode}>404</Text>
          <Text style={styles.title}>Page Not Found</Text>
          <Text style={styles.description}>
            The page you're looking for doesn't exist or has been moved.
          </Text>
          
          <Link href="/sign-in" asChild>
            <Pressable style={styles.button}>
              <Home size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorCode: {
    fontSize: 96,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});