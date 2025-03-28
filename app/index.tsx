import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LogIn, UserPlus } from 'lucide-react-native';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1800&auto=format&fit=crop&q=80';

export default function LandingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Get user profile including user_type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, profile_completed')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Route based on user type and profile completion
      if (!profile.profile_completed) {
        router.replace('/onboarding');
      } else if (profile.user_type === 'advisor') {
        router.replace('/(advisor)');
      } else {
        router.replace('/(user)');
      }
    } catch (error) {
      console.error('Session check error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: HERO_IMAGE }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>associate</Text>
          <Text style={styles.tagline}>Expert guidance at your fingertips</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.signInButton} 
            onPress={() => router.push('/sign-in')}
          >
            <LogIn size={24} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>

          <Text style={styles.orText}>or</Text>

          <Pressable 
            style={styles.signUpButton} 
            onPress={() => router.push('/sign-up')}
          >
            <UserPlus size={24} color="#007AFF" style={styles.buttonIcon} />
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join our community of experts and seekers
          </Text>
          <Text style={styles.footerHighlight}>
            Connect • Learn • Grow
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Platform.OS === 'web' ? 40 : 20,
    paddingTop: Platform.OS === 'web' ? 80 : 60,
    paddingBottom: Platform.OS === 'web' ? 80 : 40,
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    fontSize: Platform.OS === 'web' ? 64 : 48,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 16,
  },
  tagline: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    maxWidth: 400,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  signInButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: Platform.OS === 'web' ? 20 : 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Platform.OS === 'web' ? 20 : 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 12,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  orText: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  footerHighlight: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.9,
  },
});