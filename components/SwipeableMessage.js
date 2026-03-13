import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const SWIPE_THRESHOLD = 60;
const FEEDBACK_CHIPS = ['Inaccurate', 'Too Vague', 'Too Long'];
const EMOJIS = ['🙏', '✨', '🌙', '😊', '❤️'];

export default function SwipeableMessage({ message, onReply, allMessages }) {
  const translateX = useSharedValue(0);

  const [feedbackType, setFeedbackType] = React.useState(null);
  const [showChips, setShowChips] = React.useState(false);
  const [selectedChip, setSelectedChip] = React.useState(null);
  const [showEmojiBar, setShowEmojiBar] = React.useState(false);
  const [reaction, setReaction] = React.useState(null);

  const emojiBarScale = useSharedValue(0.7);
  const emojiBarOpacity = useSharedValue(0);

  const repliedMsg = message.replyTo
    ? allMessages.find((m) => m.id === message.replyTo)
    : null;

  const isUser = message.sender === 'user';
  const isSystem = message.type === 'event';
  const isAI = message.sender === 'ai_astrologer';

  const openEmojiBar = () => {
    setShowEmojiBar(true);
    emojiBarScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    emojiBarOpacity.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const closeEmojiBar = () => {
    emojiBarScale.value = withSpring(0.7, { damping: 12, stiffness: 200 });
    emojiBarOpacity.value = withSpring(0, { damping: 12, stiffness: 200 }, () => {
      runOnJS(setShowEmojiBar)(false);
    });
  };

  const handleEmojiSelect = (emoji) => {
    setReaction((prev) => (prev === emoji ? null : emoji));
    closeEmojiBar();
  };

  // Long press gesture — runs simultaneously with pan so both work together
  const longPressGesture = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => {
      runOnJS(openEmojiBar)();
    });

  const panGesture = Gesture.Pan()
    .activeOffsetX([15, 9999])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = Math.min(e.translationX, 100);
      }
    })
    .onEnd(() => {
      if (translateX.value >= SWIPE_THRESHOLD) {
        runOnJS(onReply)(message);
      }
      translateX.value = withSpring(0, { damping: 15, stiffness: 180 });
    });

  // Compose: both gestures active simultaneously on the bubble
  const composedGesture = Gesture.Simultaneous(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / SWIPE_THRESHOLD, 1),
  }));

  const emojiBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiBarScale.value }],
    opacity: emojiBarOpacity.value,
  }));

  const handleLike = () => {
    setFeedbackType('liked');
    setShowChips(false);
    setSelectedChip(null);
  };

  const handleDislike = () => {
    setFeedbackType('disliked');
    setShowChips((prev) => !prev);
  };

  const handleChipSelect = (chip) => {
    setSelectedChip(chip);
    setShowChips(false);
  };

  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <Animated.View style={[styles.replyIcon, iconOpacity]}>
        <Text style={{ fontSize: 16 }}>↩️</Text>
      </Animated.View>

      <View style={[styles.messageColumn, isUser ? styles.colRight : styles.colLeft]}>

        {/* Emoji bar — sibling of GestureDetector, above bubble */}
        {showEmojiBar && (
          <Animated.View style={[
            styles.emojiBar,
            isUser ? styles.emojiBarRight : styles.emojiBarLeft,
            emojiBarStyle,
          ]}>
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => handleEmojiSelect(e)}
                style={styles.emojiBtn}
              >
                <Text style={styles.emojiOption}>{e}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={closeEmojiBar} style={styles.emojiCloseBtn}>
              <Text style={styles.emojiCloseText}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Single GestureDetector with composed pan + longpress */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={animatedStyle}>
            <MessageBubble
              message={message}
              repliedMsg={repliedMsg}
              isUser={isUser}
            />
          </Animated.View>
        </GestureDetector>

        {/* Reaction badge below bubble */}
        {reaction && (
          <View style={[styles.reactionBadge, isUser ? styles.badgeRight : styles.badgeLeft]}>
            <Text style={styles.reactionEmoji}>{reaction}</Text>
          </View>
        )}

        {/* Like / Dislike — outside GestureDetector */}
        {isAI && (
          <View style={styles.feedbackSection}>
            <View style={styles.feedbackRow}>
              <TouchableOpacity onPress={handleLike} style={styles.feedbackBtn}>
                <Text style={[styles.feedbackIcon, feedbackType === 'liked' && styles.active]}>
                  👍
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDislike} style={styles.feedbackBtn}>
                <Text style={[styles.feedbackIcon, feedbackType === 'disliked' && styles.active]}>
                  👎
                </Text>
              </TouchableOpacity>

              {selectedChip != null && !showChips && (
                <Text style={styles.selectedChipLabel}>{'· ' + String(selectedChip)} {' '}</Text>
              )}
            </View>

            {showChips && (
              <View style={styles.chipsRow}>
                {FEEDBACK_CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => handleChipSelect(chip)}
                    style={[styles.chip, selectedChip === chip && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedChip === chip && styles.chipTextActive]}>
                      {chip} {' '}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function MessageBubble({ message, repliedMsg, isUser }) {
  const isAI = message.sender === 'ai_astrologer';
  const bubbleColor = isUser ? '#6A0DAD' : isAI ? '#1e1e3a' : '#2c2c3e';

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.wrapperRight : styles.wrapperLeft]}>
      {repliedMsg && (
        <View style={styles.replyPreview}>
          <Text style={styles.replyPreviewText} numberOfLines={1}>
            ↩ {repliedMsg.text}
          </Text>
        </View>
      )}
      <View style={[styles.bubble, { backgroundColor: bubbleColor }]}>
        {isAI && <Text style={styles.senderLabel}>🤖 AI Astrologer</Text>}
        <Text style={styles.bubbleText}>{message.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingHorizontal: 8,
  },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  replyIcon: { marginHorizontal: 4, marginTop: 10 },
  messageColumn: {
    maxWidth: '80%',
    flexDirection: 'column',
  },
  colRight: { alignItems: 'flex-end' },
  colLeft: { alignItems: 'flex-start' },
  bubbleWrapper: { flexDirection: 'column' },
  wrapperRight: { alignItems: 'flex-end' },
  wrapperLeft: { alignItems: 'flex-start' },
  systemRow: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemText: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 2,
  },
  senderLabel: {
    color: '#bb86fc',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  bubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  timestamp: {
    color: '#ffffff70',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  replyPreview: {
    backgroundColor: '#ffffff15',
    borderLeftWidth: 3,
    borderLeftColor: '#bb86fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  replyPreviewText: { color: '#ccc', fontSize: 12 },
  emojiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#3a3a5c',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  emojiBarLeft: { alignSelf: 'flex-start' },
  emojiBarRight: { alignSelf: 'flex-end' },
  emojiBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  emojiOption: { fontSize: 24 },
  emojiCloseBtn: { marginLeft: 4, paddingHorizontal: 6, paddingVertical: 4 },
  emojiCloseText: { color: '#888', fontSize: 12 },
  reactionBadge: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#3a3a5c',
    marginTop: -4,
    marginBottom: 2,
  },
  badgeLeft: { alignSelf: 'flex-start', marginLeft: 8 },
  badgeRight: { alignSelf: 'flex-end', marginRight: 8 },
  reactionEmoji: { fontSize: 16 },
  feedbackSection: { marginTop: 2 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center' },
  feedbackBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  feedbackIcon: { fontSize: 16, opacity: 0.4 },
  active: { opacity: 1 },
  selectedChipLabel: { color: '#bb86fc', fontSize: 12, marginLeft: 4, borderWidth: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    backgroundColor: '#3a3a5c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bb86fc',
  },
  chipActive: { backgroundColor: '#bb86fc30', borderColor: '#ffffff' },
  chipText: { color: '#bb86fc', fontSize: 12 },
  chipTextActive: { color: '#fff' },
});