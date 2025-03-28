import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogIn, Mail, Lock } from 'lucide-react-native';

const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1800&auto=format&fit=crop&q=80';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Get user type from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, profile_completed')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      // Redirect based on profile completion and user type
      if (!profile.profile_completed) {
        router.replace('/profile');
      } else if (profile.user_type === 'advisor') {
        router.replace('/(advisor)');
      } else {
        router.replace('/(user)');
      }
    } catch (e) {
      console.error('Sign in error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: BACKGROUND_IMAGE }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.replace('/')}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.logo}>associate</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color="#666666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, loading && styles.inputDisabled]}
              placeholder="Email"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#666666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, loading && styles.inputDisabled]}
              placeholder="Password"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoComplete="current-password"
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <LogIn size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.signInButtonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>

          <Link href="/sign-up" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flex: 1,
    padding: Platform.OS === 'web' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 40 : 20,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  formContainer: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: Platform.OS === 'web' ? 40 : 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#fff2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputDisabled: {
    opacity: 0.7,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 48,
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: '#999999',
  },
  buttonIcon: {
    marginRight: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  linkTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});