import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react-native';

const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1800&auto=format&fit=crop&q=80';

type UserType = 'user' | 'advisor';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      setError(null);

      // Create auth user with metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            user_type: userType
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Signup failed');

      // Update the profile instead of creating a new one
      // The profile is already created by the database trigger
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: email.trim(),
          user_type: userType,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error('Failed to update profile');
      }

      // Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (signInError) throw signInError;

      router.replace('/onboarding');
    } catch (e) {
      console.error('Signup error:', e);
      setError(e.message || 'Failed to create account');
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our community today</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.roleSelector}>
            <Pressable
              style={[
                styles.roleButton,
                userType === 'user' && styles.roleButtonActive,
                loading && styles.buttonDisabled
              ]}
              onPress={() => setUserType('user')}
              disabled={loading}
            >
              <User size={20} color={userType === 'user' ? '#ffffff' : '#666666'} style={styles.roleIcon} />
              <Text
                style={[
                  styles.roleButtonText,
                  userType === 'user' && styles.roleButtonTextActive,
                ]}
              >
                User
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleButton,
                userType === 'advisor' && styles.roleButtonActive,
                loading && styles.buttonDisabled
              ]}
              onPress={() => setUserType('advisor')}
              disabled={loading}
            >
              <Briefcase size={20} color={userType === 'advisor' ? '#ffffff' : '#666666'} style={styles.roleIcon} />
              <Text
                style={[
                  styles.roleButtonText,
                  userType === 'advisor' && styles.roleButtonTextActive,
                ]}
              >
                Advisor
              </Text>
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#666666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, loading && styles.inputDisabled]}
              placeholder="Email"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
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
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.signUpButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <UserPlus size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.signUpButtonText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </Pressable>

          <Link href="/sign-in" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
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
  cooldownText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleIcon: {
    marginRight: 8,
  },
  roleButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  roleButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
  signUpButton: {
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
  signUpButtonText: {
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