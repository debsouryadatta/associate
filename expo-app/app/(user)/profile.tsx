import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Settings, LogOut, CreditCard as Edit2, Mail, User, Calendar } from 'lucide-react-native';
import ProfileEditDialog from '@/components/ProfileEditDialog';
import ImageUpload from '@/components/ImageUpload';

const PROFILE_COVER = 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1800&auto=format&fit=crop&q=80';

interface Profile {
  id: string;
  user_type: 'user' | 'advisor';
  full_name: string | null;
  email: string | null;
  created_at: string;
  profile_completed: boolean;
  image_url: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
}

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  'prefer_not_to_say': 'Prefer not to say'
};

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error('Error fetching profile:', e);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = async (url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ image_url: url })
        .eq('id', user.id);

      if (error) throw error;
      fetchProfile();
    } catch (e) {
      console.error('Error updating profile image:', e);
      setError('Failed to update profile image');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Failed to load profile'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: PROFILE_COVER }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay} />
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.profileMain}>
            <ImageUpload
              imageUrl={profile.image_url}
              onImageUploaded={handleImageUploaded}
              size={80}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {profile.full_name || 'Update your profile'}
              </Text>
              <Text style={styles.userType}>User Account</Text>
            </View>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => setIsEditDialogVisible(true)}
          >
            <Edit2 size={20} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.detailItem}>
            <Mail size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <User size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>
                {profile.full_name || 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Calendar size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <User size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>
                {profile.gender ? GENDER_LABELS[profile.gender] : 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <Pressable style={styles.settingsButton}>
            <Settings size={20} color="#666" />
            <Text style={styles.settingsButtonText}>Account Settings</Text>
          </Pressable>

          <Pressable 
            style={[styles.settingsButton, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#ff3b30" />
            <Text style={[styles.settingsButtonText, styles.signOutText]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ProfileEditDialog
        visible={isEditDialogVisible}
        onClose={() => setIsEditDialogVisible(false)}
        onSave={fetchProfile}
        profile={profile}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  profileHeader: {
    marginTop: -50,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  userType: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f2ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  editButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  detailsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  settingsContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  settingsButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  signOutButton: {
    marginTop: 8,
  },
  signOutText: {
    color: '#ff3b30',
  },
});