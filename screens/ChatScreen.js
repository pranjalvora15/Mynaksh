import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeableMessage from '../components/SwipeableMessage';
import RatingOverlay from '../components/RatingOverlay';
import { INITIAL_MESSAGES } from '../data/messages';

export default function ChatScreen() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const flatListRef = useRef(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: inputText.trim(),
      timestamp: Date.now(),
      type: 'text',
      replyTo: replyingTo?.id || null,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setReplyingTo(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🔮 MyNaksh</Text>
            <Text style={styles.headerSub}>Session with Astrologer Vikram</Text>
          </View>
          <TouchableOpacity
            style={styles.endBtn}
            onPress={() => setShowRating(true)}
          >
            <Text style={styles.endBtnText}>End Chat</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Message list */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <SwipeableMessage
                message={item}
                allMessages={messages}
                onReply={handleReply}
              />
            )}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* Replying-to bar */}
          {replyingTo && (
            <View style={styles.replyBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.replyBarLabel}>Replying to:</Text>
                <Text style={styles.replyBarText} numberOfLines={1}>
                  {replyingTo.text}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelReply}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input bar */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#666"
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Rating overlay */}
        {showRating && (
          <RatingOverlay onClose={() => setShowRating(false)} />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#13132b',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#888', fontSize: 12 },
  endBtn: {
    backgroundColor: '#8b0000',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  endBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { paddingVertical: 12 },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e3a',
    borderLeftWidth: 3,
    borderLeftColor: '#bb86fc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  replyBarLabel: { color: '#bb86fc', fontSize: 11, fontWeight: '600' },
  replyBarText: { color: '#ccc', fontSize: 13 },
  cancelReply: { color: '#ff6b6b', fontSize: 13, fontWeight: '600', paddingLeft: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#13132b',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e3a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#6A0DAD',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 18 },
});