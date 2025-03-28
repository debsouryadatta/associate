import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useOnlineAdvisors } from '@/hooks/useOnlineStatus';
import OnlineStatusIndicator from './OnlineStatusIndicator';

// Default images for advisors without profile pictures
const DEFAULT_IMAGES = {
  male: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  female: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80'
};

interface OnlineAdvisorsListProps {
  domain: string;
}

export default function OnlineAdvisorsList({ domain }: OnlineAdvisorsListProps) {
  const { advisors, loading } = useOnlineAdvisors(domain);
  
  // Navigate to advisor profile
  const navigateToAdvisorProfile = (advisorId: string) => {
    router.push(`/advisor/${advisorId}`);
  };
  
  // Get appropriate image for advisor
  const getAdvisorImage = (advisor: any) => {
    if (advisor.profiles?.image_url) return advisor.profiles.image_url;
    if (advisor.profiles?.gender === 'male') return DEFAULT_IMAGES.male;
    if (advisor.profiles?.gender === 'female') return DEFAULT_IMAGES.female;
    return DEFAULT_IMAGES.default;
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading online advisors...</Text>
      </View>
    );
  }
  
  if (advisors.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No advisors currently online</Text>
        <Text style={styles.emptySubtext}>Check back later to connect with experts</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Advisors</Text>
      <Text style={styles.subtitle}>Connect with experts available right now</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {advisors.map((advisor) => (
          <Pressable
            key={advisor.id}
            style={styles.advisorCard}
            onPress={() => navigateToAdvisorProfile(advisor.id)}
          >
            <View style={styles.advisorImageContainer}>
              <Image
                source={{ uri: getAdvisorImage(advisor) }}
                style={styles.advisorImage}
              />
              <View style={styles.statusIndicator}>
                <OnlineStatusIndicator userId={advisor.id} size="small" />
              </View>
            </View>
            
            <View style={styles.advisorInfo}>
              <Text numberOfLines={1} style={styles.advisorName}>
                {advisor.profiles?.full_name || 'Advisor'}
              </Text>
              <Text numberOfLines={1} style={styles.advisorExperience}>
                {advisor.profiles?.years_of_experience 
                  ? `${advisor.profiles.years_of_experience} yrs exp` 
                  : 'Expert'}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  advisorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  advisorCard: {
    width: 110,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  advisorImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  advisorImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  advisorInfo: {
    gap: 2,
  },
  advisorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  advisorExperience: {
    fontSize: 11,
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
