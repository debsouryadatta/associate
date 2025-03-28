import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator';

export default function AdvisorDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch current user session and profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) return;
        
        const userId = data.session.user.id;
        setUserId(userId);
        
        // Get advisor profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching advisor data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Track advisor's online status with their domain
  useOnlineStatus(userId || '', 'advisor', profile?.domain);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refetch data
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
        
      setProfile(profileData);
    }
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Advisor Dashboard</Text>
        <Text style={styles.subtitle}>Manage your clients and appointments</Text>
        
        {/* Online status indicator */}
        {userId && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Your status:</Text>
            <View style={styles.statusIndicator}>
              <OnlineStatusIndicator userId={userId} showText size="medium" />
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Online Status Active</Text>
        <Text style={styles.infoText}>
          Clients can now see when you're online and available for consultation.
          Your online status is automatically updated based on your app activity.
        </Text>
      </View>
      
      {/* Rest of dashboard content will go here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0d47a1',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});