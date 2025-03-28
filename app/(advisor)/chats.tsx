import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, RefreshControl, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Search } from 'lucide-react-native';

// Default images based on gender
const DEFAULT_IMAGES = {
  male: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  female: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80'
};

interface Chat {
  id: string;
  advisor_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_message: {
    content: string;
    created_at: string;
  } | null;
  user: {
    full_name: string | null;
    image_url: string | null;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  };
}

export default function AdvisorChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getUserImage = (user: Chat['user']) => {
    if (user.image_url) return user.image_url;
    if (user.gender === 'male') return DEFAULT_IMAGES.male;
    if (user.gender === 'female') return DEFAULT_IMAGES.female;
    return DEFAULT_IMAGES.default;
  };

  const fetchChats = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('chats')
        .select(`
          *,
          last_message:messages(
            content,
            created_at
          ),
          user:profiles!chats_user_id_fkey(
            full_name,
            image_url,
            gender
          )
        `)
        .eq('advisor_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Process the data to get only the latest message for each chat
      const processedChats = data.map(chat => ({
        ...chat,
        last_message: chat.last_message?.[0] || null
      }));
      
      setChats(processedChats);
      setFilteredChats(processedChats);
    } catch (e) {
      console.error('Error fetching chats:', e);
      setError('Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredChats(chats);
      return;
    }

    const filtered = chats.filter(chat => {
      const searchableText = [
        chat.user.full_name,
        chat.last_message?.content
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.toLowerCase().split(' ').every(term => searchableText.includes(term));
    });

    setFilteredChats(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchChats();

    // Subscribe to new messages
    const subscription = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const navigateToChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color="#666" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Wait for users to start conversations with you
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.chatItem}
              onPress={() => navigateToChat(item.id)}
            >
              <Image
                source={{ uri: getUserImage(item.user) }}
                style={styles.userImage}
              />
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.userName}>
                    {item.user.full_name || `User ${item.user_id.slice(0, 8)}`}
                  </Text>
                  {item.last_message && (
                    <Text style={styles.timestamp}>
                      {formatTime(item.last_message.created_at)}
                    </Text>
                  )}
                </View>
                <Text style={styles.lastMessage} numberOfLines={2}>
                  {item.last_message?.content || 'No messages yet'}
                </Text>
              </View>
            </Pressable>
          )}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  errorContainer: {
    backgroundColor: '#fff2f2',
    padding: 16,
    margin: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  userImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e93',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});