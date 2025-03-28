import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';

type UserType = 'user' | 'advisor';

/**
 * Hook to track and update user's online status
 * @param userId - The user's ID
 * @param userType - The type of user ('user' or 'advisor')
 * @param domain - Optional domain for advisors
 */
export function useOnlineStatus(userId: string, userType: UserType, domain?: string) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  useEffect(() => {
    if (!userId) return;
    
    // Set online when component mounts
    updateStatus(true);
    
    // Create heartbeat interval
    const heartbeatInterval = setInterval(() => {
      // Only send heartbeat if app is active
      if (appStateRef.current === 'active') {
        updateStatus(true);
      }
    }, 30000); // Update every 30 seconds
    
    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      
      if (nextAppState === 'active') {
        updateStatus(true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        updateStatus(false);
      }
    });
    
    // Cleanup function
    return () => {
      clearInterval(heartbeatInterval);
      subscription.remove();
      updateStatus(false);
    };
  }, [userId, userType, domain]);
  
  /**
   * Function to update online status in Supabase
   * @param isOnline - Whether the user is online
   */
  const updateStatus = async (isOnline: boolean) => {
    try {
      if (!userId) return;
      
      const statusData = {
        id: userId,
        user_type: userType,
        is_online: isOnline,
        last_active: new Date().toISOString()
      };
      
      // Add domain if user is an advisor
      if (userType === 'advisor' && domain) {
        Object.assign(statusData, { domain });
      }
      
      await supabase
        .from('user_status')
        .upsert(statusData);
        
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };
}

/**
 * Hook to check if a specific user is online
 * @param userId - The user's ID to check
 * @returns Object containing isOnline status and loading state
 */
export function useUserOnlineStatus(userId: string | null) {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    const checkStatus = async () => {
      try {
        setLoading(true);
        // Consider someone offline if they haven't sent a heartbeat in 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('user_status')
          .select('is_online, last_active')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        // User is online if they're marked as online and have been active recently
        const isUserOnline = data?.is_online && 
          data?.last_active && 
          new Date(data.last_active) > new Date(twoMinutesAgo);
          
        setIsOnline(!!isUserOnline);
      } catch (error) {
        console.error('Error checking online status:', error);
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial check
    checkStatus();
    
    // Setup subscription for real-time updates
    const subscription = supabase
      .channel('user_status_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_status',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        if (payload.new) {
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
          const newData = payload.new as { is_online?: boolean; last_active?: string };
          const isUserOnline = newData.is_online && 
            newData.last_active && 
            new Date(newData.last_active) > new Date(twoMinutesAgo);
            
          setIsOnline(!!isUserOnline);
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
  
  return { isOnline, loading };
}

/**
 * Hook to fetch online advisors by domain
 * @param domain - The domain to filter advisors by
 * @returns Object containing advisors array and loading state
 */
export function useOnlineAdvisors(domain: string) {
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (!domain) {
      setLoading(false);
      return;
    }
    
    const fetchOnlineAdvisors = async () => {
      try {
        setLoading(true);
        // Consider someone offline if they haven't sent a heartbeat in 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('user_status')
          .select(`
            id,
            is_online,
            last_active,
            domain,
            profiles:id(full_name, image_url, gender, bio, years_of_experience)
          `)
          .eq('user_type', 'advisor')
          .eq('domain', domain)
          .eq('is_online', true)
          .gte('last_active', twoMinutesAgo);
          
        if (error) throw error;
        
        setAdvisors(data || []);
      } catch (error) {
        console.error('Error fetching online advisors:', error);
        setAdvisors([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchOnlineAdvisors();
    
    // Setup subscription for real-time updates
    const subscription = supabase
      .channel('online_advisors')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_status',
        filter: `user_type=eq.advisor`,
      }, () => {
        // Refetch advisors when any advisor status changes
        fetchOnlineAdvisors();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [domain]);
  
  return { advisors, loading };
}

// Import useState for the hooks that need it
import { useState } from 'react';
