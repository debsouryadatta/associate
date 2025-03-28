import { useEffect, useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Users, MessageCircle, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AdvisorLayout() {
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfileCompleted(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('profile_completed, user_type')
        .eq('id', user.id)
        .single();

      if (!data) {
        setProfileCompleted(false);
        return;
      }

      setUserType(data.user_type);
      setProfileCompleted(data.profile_completed);
    } catch (e) {
      console.error('Error checking profile status:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Redirect to user layout if user is not an advisor
  if (userType !== 'advisor') {
    return <Redirect href="/(user)" />;
  }

  // Redirect to onboarding if profile is not completed
  if (profileCompleted === false) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f1f1',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}