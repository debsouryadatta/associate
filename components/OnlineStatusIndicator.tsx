import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserOnlineStatus } from '@/hooks/useOnlineStatus';

interface OnlineStatusIndicatorProps {
  userId: string | null;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Component to display a user's online status
 */
export default function OnlineStatusIndicator({ 
  userId, 
  showText = false,
  size = 'small'
}: OnlineStatusIndicatorProps) {
  const { isOnline, loading } = useUserOnlineStatus(userId);
  
  // Don't render anything if loading or no userId
  if (loading || !userId) return null;
  
  // Determine indicator size
  const indicatorSize = {
    small: 8,
    medium: 12,
    large: 16
  }[size];
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.indicator, 
          { 
            backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E',
            width: indicatorSize,
            height: indicatorSize,
            borderRadius: indicatorSize / 2
          }
        ]} 
      />
      {showText && (
        <Text style={[
          styles.statusText,
          { color: isOnline ? '#4CAF50' : '#9E9E9E' }
        ]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  }
});
