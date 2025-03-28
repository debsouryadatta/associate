import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image, Platform } from 'react-native';
import { router, Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Mail, User, FileText, Briefcase, Clock, LogOut } from 'lucide-react-native';

const PROFILE_COVER = 'https://images.unsplash.com/photo-1604933762023-7213af7ff7a7?w=1800&auto=format&fit=crop&q=80';

const DOMAIN_OPTIONS = [
  { label: 'Finance', value: 'finance' },
  { label: 'Tax', value: 'tax' },
  { label: 'Legal', value: 'legal' },
];

interface Profile {
  id: string;
  user_type: 'user' | 'advisor';
  full_name: string | null;
  email: string | null;
  bio: string | null;
  domain: string | null;
  years_of_experience: number | null;
  profile_completed: boolean;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [domain, setDomain] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [gender, setGender] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setFullName(data.full_name || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      setDomain(data.domain || '');
      setYearsOfExperience(data.years_of_experience?.toString() || '');
      setGender(data.gender || '');
    } catch (e) {
      console.error('Error fetching profile:', e);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!fullName.trim() || !email.trim() || !gender) {
        throw new Error('Please fill in all required fields');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates = {
        full_name: fullName.trim(),
        email: email.trim(),
        gender,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };

      if (profile?.user_type === 'advisor') {
        if (!bio.trim() || !domain.trim() || !yearsOfExperience) {
          throw new Error('Please fill in all required fields');
        }

        const years = parseInt(yearsOfExperience);
        if (isNaN(years) || years < 0) {
          throw new Error('Please enter a valid number of years');
        }

        Object.assign(updates, {
          bio: bio.trim(),
          domain: domain.trim(),
          years_of_experience: years
        });
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      if (profile?.user_type === 'advisor') {
        router.replace('/(advisor)');
      } else {
        router.replace('/(user)');
      }
    } catch (e) {
      console.error('Error saving profile:', e);
      setError(e.message);
    } finally {
      setSaving(false);
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
    return <Redirect href="/sign-in" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: PROFILE_COVER }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <View style={styles.coverOverlay} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Image
            source={{ 
              uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${profile.id}&backgroundColor=b6e3f4`
            }}
            style={styles.avatar}
          />
          <View style={styles.headerContent}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              {profile.user_type === 'advisor' 
                ? 'Set up your advisor profile to start helping others'
                : 'Tell us about yourself to get started'
              }
            </Text>
          </View>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                editable={!saving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.genderOption,
                    gender === option.value && styles.genderOptionSelected
                  ]}
                  onPress={() => setGender(option.value)}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      gender === option.value && styles.genderOptionTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {profile.user_type === 'advisor' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio *</Text>
                <View style={styles.inputWrapper}>
                  <FileText size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself and your expertise"
                    multiline
                    numberOfLines={4}
                    editable={!saving}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Domain *</Text>
                <View style={styles.domainContainer}>
                  {DOMAIN_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.domainOption,
                        domain === option.value && styles.domainOptionSelected
                      ]}
                      onPress={() => setDomain(option.value)}
                      disabled={saving}
                    >
                      <Text
                        style={[
                          styles.domainOptionText,
                          domain === option.value && styles.domainOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Years of Experience *</Text>
                <View style={styles.inputWrapper}>
                  <Clock size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={yearsOfExperience}
                    onChangeText={setYearsOfExperience}
                    placeholder="Enter number of years"
                    keyboardType="number-pad"
                    editable={!saving}
                  />
                </View>
              </View>
            </>
          )}

          <Pressable
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Complete Profile'}
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#ff3b30" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fff2f2',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
  },
  formContainer: {
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
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
  textArea: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#e8f2ff',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#007AFF',
  },
  domainContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  domainOption: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  domainOptionSelected: {
    backgroundColor: '#e8f2ff',
  },
  domainOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  domainOptionTextSelected: {
    color: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f1f1',
    marginVertical: 24,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff2f2',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  signOutButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});