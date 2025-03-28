import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, Modal } from 'react-native';
import { supabase } from '@/lib/supabase';
import { X, Save, Mail, User, FileText, Briefcase, Clock } from 'lucide-react-native';

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

interface ProfileEditDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  profile: Profile | null;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const DOMAIN_OPTIONS = [
  { label: 'Finance', value: 'finance' },
  { label: 'Tax', value: 'tax' },
  { label: 'Legal', value: 'legal' },
];

export default function ProfileEditDialog({ visible, onClose, onSave, profile }: ProfileEditDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [domain, setDomain] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [gender, setGender] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setBio(profile.bio || '');
      setDomain(profile.domain || '');
      setYearsOfExperience(profile.years_of_experience?.toString() || '');
      setGender(profile.gender || '');
    }
  }, [profile]);

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

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      onSave();
      onClose();
    } catch (e) {
      console.error('Error saving profile:', e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#666" />
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.content}>
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

            {profile?.user_type === 'advisor' && (
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
          </View>

          <View style={styles.footer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#fff2f2',
    padding: 16,
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
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
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});