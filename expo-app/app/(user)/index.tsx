import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Search, Award, Star, Clock, ChevronRight, Users } from 'lucide-react-native';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1800&auto=format&fit=crop&q=80';

const DEFAULT_IMAGES = {
  male: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  female: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80'
};

const DOMAINS = ['finance', 'tax', 'legal'] as const;
type Domain = typeof DOMAINS[number];

interface Advisor {
  id: string;
  user_type: string;
  created_at: string;
  full_name: string | null;
  bio: string | null;
  domain: string | null;
  years_of_experience: number | null;
  profile_completed: boolean;
  image_url: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
}

export default function UserHome() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [filteredAdvisors, setFilteredAdvisors] = useState<Advisor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<Domain>('finance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdvisors = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'advisor')
        .eq('profile_completed', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAdvisors(data || []);
      filterAdvisors(data || [], searchQuery, selectedDomain);
    } catch (e) {
      console.error('Error fetching advisors:', e);
      setError('Failed to load advisors. Please try again.');
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

  const filterAdvisors = (advisors: Advisor[], query: string, domain: Domain) => {
    let filtered = advisors.filter(advisor => advisor.domain?.toLowerCase() === domain);

    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ');
      filtered = filtered.filter(advisor => {
        const searchableText = [
          advisor.full_name,
          advisor.domain,
          advisor.years_of_experience?.toString(),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    setFilteredAdvisors(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterAdvisors(advisors, text, selectedDomain);
  };

  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
    filterAdvisors(advisors, searchQuery, domain);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdvisors();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const navigateToAdvisorProfile = (advisorId: string) => {
    router.push(`/advisor/${advisorId}`);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.hero}>
        <Image 
          source={{ uri: HERO_IMAGE }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Expert Guidance</Text>
          <Text style={styles.heroSubtitle}>Connect with professional advisors in your field</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.domainTabs}>
          {DOMAINS.map((domain) => (
            <Pressable
              key={domain}
              style={[
                styles.domainTab,
                selectedDomain === domain && styles.domainTabActive
              ]}
              onPress={() => handleDomainSelect(domain)}
            >
              <Text
                style={[
                  styles.domainTabText,
                  selectedDomain === domain && styles.domainTabTextActive
                ]}
              >
                {domain.charAt(0).toUpperCase() + domain.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${selectedDomain} advisors...`}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <View style={styles.mainContent}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading advisors...</Text>
          </View>
        ) : filteredAdvisors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={48} color="#666" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching advisors found' : `No ${selectedDomain} advisors available`}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try different search terms' : 'Check back later for expert advisors'}
            </Text>
          </View>
        ) : (
          <View style={styles.advisorsList}>
            {filteredAdvisors.map((advisor) => (
              <Pressable
                key={advisor.id}
                style={styles.advisorCard}
                onPress={() => navigateToAdvisorProfile(advisor.id)}
              >
                <Image
                  source={{ uri: getAdvisorImage(advisor) }}
                  style={styles.advisorImage}
                />
                <View style={styles.advisorInfo}>
                  <View style={styles.advisorHeader}>
                    <Text style={styles.advisorName}>
                      {advisor.full_name || `Advisor ${advisor.id.slice(0, 8)}`}
                    </Text>
                    <View style={styles.badgeContainer}>
                      <Award size={14} color="#007AFF" />
                      <Text style={styles.badgeText}>Expert</Text>
                    </View>
                  </View>

                  {advisor.domain && (
                    <View style={styles.tagContainer}>
                      <Star size={14} color="#666" />
                      <Text style={styles.tagText}>{advisor.domain}</Text>
                    </View>
                  )}

                  {advisor.years_of_experience && (
                    <View style={styles.experienceContainer}>
                      <Clock size={14} color="#666" />
                      <Text style={styles.experienceText}>
                        {advisor.years_of_experience}+ years experience
                      </Text>
                    </View>
                  )}

                  <ChevronRight size={20} color="#666" style={styles.chevron} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  hero: {
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  domainTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  domainTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  domainTabActive: {
    backgroundColor: '#007AFF',
  },
  domainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  domainTabTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  mainContent: {
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#fff2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  advisorsList: {
    gap: 16,
  },
  advisorCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    height: 96,
  },
  advisorImage: {
    width: 96,
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  advisorInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  advisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  advisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  experienceText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },
});