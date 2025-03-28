import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Camera, Upload, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

interface ImageUploadProps {
  imageUrl: string | null;
  onImageUploaded: (url: string) => void;
  size?: number;
}

export default function ImageUpload({ imageUrl, onImageUploaded, size = 120 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      setError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await uploadImage(result.assets[0].base64);
      }
    } catch (e) {
      console.error('Error picking image:', e);
      setError('Failed to pick image');
    }
  };

  const uploadImage = async (base64Image: string) => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Remove old image if it exists
      if (imageUrl) {
        const oldPath = imageUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new image
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, decode(base64Image), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      onImageUploaded(publicUrl);
    } catch (e) {
      console.error('Error uploading image:', e);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      setError(null);
      if (!imageUrl) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      await supabase.storage
        .from('profile-pictures')
        .remove([`${user.id}/${fileName}`]);

      onImageUploaded('');
    } catch (e) {
      console.error('Error removing image:', e);
      setError('Failed to remove image');
    }
  };

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.imageContainer,
          { width: size, height: size, borderRadius: size / 2 }
        ]}
      >
        {imageUrl ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, { borderRadius: size / 2 }]}
            />
            <Pressable
              style={styles.removeButton}
              onPress={removeImage}
            >
              <X size={16} color="#fff" />
            </Pressable>
          </>
        ) : (
          <Camera size={size / 2} color="#666" />
        )}

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <Upload size={24} color="#fff" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Pressable
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={pickImage}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {imageUrl ? 'Change Photo' : 'Upload Photo'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});