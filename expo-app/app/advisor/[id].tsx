import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Award, Star, Clock, MessageCircle, Mail, Briefcase } from 'lucide-react-native';

// Default images based on gender
const DEFAULT_IMAGES = {
  male: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80',
  female: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=80'
};

interface Advisor {
  id: string;
  user_type: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  domain: string | null;
  years_of_experience: number | null;
  image_url: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
}

export default function AdvisorProfile() {
  const { id } = useLocalSearchParams();
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvisor();
  }, [id]);

  const fetchAdvisor = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('user_type', 'advisor')
        .single();

      if (fetchError) throw fetchError;
      setAdvisor(data);
    } catch (e) {
      console.error('Error fetching advisor:', e);
      setError('Failed to load advisor profile');
    } finally {
      setLoading(false);
    }
  };

  const getAdvisorImage = (advisor: Advisor) => {
    if (advisor.image_url) return advisor.image_url;
    if (advisor.gender === 'male') return DEFAULT_IMAGES.male;
    if (advisor.gender === 'female') return DEFAULT_IMAGES.female;
    return DEFAULT_IMAGES.default;
  };

  const handleStartChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', user.id)
        .eq('advisor_id', id)
        .single();

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          advisor_id: id
        })
        .select()
        .single();

      if (chatError) throw chatError;
      if (!newChat) throw new Error('Failed to create chat');

      router.push(`/chat/${newChat.id}`);
    } catch (e) {
      console.error('Error starting chat:', e);
      setError('Failed to start chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !advisor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Advisor not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Advisor Profile</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getAdvisorImage(advisor) }}
            style={styles.advisorImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.advisorName}>
                {advisor.full_name || `Advisor ${advisor.id.slice(0, 8)}`}
              </Text>
              <View style={styles.badgeContainer}>
                <Award size={16} color="#007AFF" />
                <Text style={styles.badgeText}>Expert Advisor</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              {advisor.domain && (
                <View style={styles.statItem}>
                  <Star size={20} color="#666" />
                  <Text style={styles.statLabel}>Specialization</Text>
                  <Text style={styles.statValue}>{advisor.domain}</Text>
                </View>
              )}
              
              {advisor.years_of_experience && (
                <View style={styles.statItem}>
                  <Clock size={20} color="#666" />
                  <Text style={styles.statLabel}>Experience</Text>
                  <Text style={styles.statValue}>{advisor.years_of_experience}+ years</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>
              {advisor.bio || 'Professional advisor ready to help you succeed.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.contactItem}>
              <Mail size={20} color="#666" />
              <Text style={styles.contactText}>{advisor.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Briefcase size={20} color="#666" />
              <Text style={styles.contactText}>{advisor.domain}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.chatButton}
          onPress={handleStartChat}
        >
          <MessageCircle size={24} color="#ffffff" />
          <Text style={styles.chatButtonText}>Start Conversation</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  advisorImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: -40,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nameContainer: {
    marginBottom: 20,
  },
  advisorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    padding: 20,
    paddingBottom: Platform.OS === 'web' ? 20 : 36,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
});