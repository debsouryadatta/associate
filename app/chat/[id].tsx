import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Award } from 'lucide-react-native';

// Default images based on gender
const DEFAULT_IMAGES = {
  male: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  female: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80'
};

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

interface ChatParticipant {
  id: string;
  user_type: string;
  full_name: string | null;
  image_url: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
}

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ChatParticipant | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const getParticipantImage = (participant: ChatParticipant) => {
    if (participant.image_url) return participant.image_url;
    if (participant.gender === 'male') return DEFAULT_IMAGES.male;
    if (participant.gender === 'female') return DEFAULT_IMAGES.female;
    return DEFAULT_IMAGES.default;
  };

  const fetchMessages = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      setCurrentUser(user.id);

      // Fetch chat details
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('user_id, advisor_id')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;

      // Set the other participant's ID
      const otherParticipantId = chatData.user_id === user.id ? chatData.advisor_id : chatData.user_id;

      // Fetch participant details
      const { data: participantData, error: participantError } = await supabase
        .from('profiles')
        .select('id, user_type, full_name, image_url, gender')
        .eq('id', otherParticipantId)
        .single();

      if (participantError) throw participantError;
      setParticipant(participantData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Mark messages as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessages = messagesData.filter(
          msg => msg.sender_id !== user.id && !msg.read_at
        );

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Mark message as read if it's from the other participant
          if (currentUser && newMessage.sender_id !== currentUser) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMessage.id);
          }

          setMessages(current => [...current, newMessage]);
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [chatId, currentUser]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data, error: sendError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: newMessage.trim(),
          sender_id: currentUser
        })
        .select()
        .single();

      if (sendError) throw sendError;

      // Optimistically add the message to the UI
      if (data) {
        setMessages(current => [...current, data]);
        setNewMessage('');
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (e) {
      console.error('Error sending message:', e);
      setError('Failed to send message. Please try again.');
    }
  };

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

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#007AFF" />
        </Pressable>

        {participant && (
          <View style={styles.participantInfo}>
            <Image
              source={{ uri: getParticipantImage(participant) }}
              style={styles.participantImage}
            />
            <View style={styles.participantDetails}>
              <Text style={styles.participantName}>
                {participant.full_name || `Advisor ${participant.id.slice(0, 8)}`}
              </Text>
              <View style={styles.badgeContainer}>
                <Award size={12} color="#007AFF" />
                <Text style={styles.badgeText}>Expert Advisor</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.sender_id === currentUser
                  ? styles.sentMessage
                  : styles.receivedMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.sender_id === currentUser
                    ? styles.sentBubble
                    : styles.receivedBubble,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  item.sender_id === currentUser
                    ? styles.sentMessageText
                    : styles.receivedMessageText,
                ]}>
                  {item.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    item.sender_id === currentUser
                      ? styles.sentTime
                      : styles.receivedTime,
                  ]}
                >
                  {formatTime(item.created_at)}
                  {item.sender_id === currentUser && (
                    <Text style={styles.readStatus}>
                      {item.read_at ? ' ✓✓' : ' ✓'}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <Pressable
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Send
            size={20}
            color={newMessage.trim() ? '#007AFF' : '#8E8E93'}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  participantImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  participantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
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
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#ffffff',
  },
  receivedMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTime: {
    color: '#8E8E93',
  },
  readStatus: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});