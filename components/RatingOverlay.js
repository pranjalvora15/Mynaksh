import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function RatingOverlay({ onClose }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const cardScale = useSharedValue(0.85);

  React.useEffect(() => {
    cardScale.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Please select a rating before submitting.');
      return;
    }
    Alert.alert(
      'Thank You!',
      `Your rating of ${rating} star${rating > 1 ? 's' : ''} has been recorded.`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={StyleSheet.absoluteFillObject}
    >
      <BlurView intensity={60} tint="dark" style={styles.blur}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.moonEmoji}>🌙</Text>
          <Text style={styles.title}>Session Complete</Text>
          <Text style={styles.subtitle}>
            How was your consultation with Astrologer Vikram?
          </Text>

          {/* 5-star rating */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <StarButton
                key={star}
                filled={star <= rating}
                onPress={() => setRating(star)}
              />
            ))}
          </View>

          {rating > 0 && (
            <Animated.Text entering={FadeIn} style={styles.ratingLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
            </Animated.Text>
          )}

          <Text style={styles.thankYou}>
            ✨ Thank you for choosing MyNaksh. May the stars guide you always. ✨
          </Text>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
}

function StarButton({ filled, onPress }) {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.3, { damping: 5 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.Text style={[styles.star, style]}>
        {filled ? '⭐' : '☆'}
      </Animated.Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bb86fc40',
    shadowColor: '#bb86fc',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  moonEmoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  star: { fontSize: 36 },
  ratingLabel: {
    color: '#bb86fc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  thankYou: {
    color: '#ffffff80',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  submitBtn: {
    backgroundColor: '#6A0DAD',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  skipBtn: { padding: 8 },
  skipText: { color: '#888', fontSize: 13 },
});