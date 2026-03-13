# MyNaksh — Astrologer Chat UI

A React Native chat interface built as a machine coding assignment. Features swipe-to-reply, long-press emoji reactions, AI message feedback (like/dislike with chips), and a session rating overlay.

---

## Prerequisites

- **Node.js 20.11.0** — download: https://nodejs.org/en/blog/release/v20.11.0
  Or via nvm: `nvm install 20.11.0 && nvm use 20.11.0`
- **Expo Go (SDK 52)**
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
  - iOS: https://apps.apple.com/app/expo-go/id982107779

> Both your phone and development machine must be on the **same Wi-Fi network**.

---

## Steps to Run

```bash
# 1. Clone the repo and install dependencies
git clone <repo-url>
# git clone https://github.com/pranjalvora15/Mynaksh.git
cd mynaksh
npm install

# 2. Start the Expo dev server
npx expo start --go
```

Then:
- **Android** — open Expo Go → tap **Scan QR code** → scan the QR shown in terminal
- **iOS** — open the default **Camera app** → point at the QR code → tap the Expo Go banner

The app will bundle and load on your device within a few seconds.

---

## Project Structure

```
├── App.js
├── screens/
│   └── ChatScreen.js       # Main screen: message list, input bar, reply bar
├── components/
│   ├── SwipeableMessage.js # Individual message row with all interactions
│   └── RatingOverlay.js    # End-session star rating modal
└── data/
    └── messages.js         # Seed messages for the chat
```

---

## How Reanimated 3 Was Used

Reanimated 3 drives all animated values in the project via `useSharedValue` and `useAnimatedStyle`, keeping animations off the JS thread for smooth 60fps performance.

**Swipe-to-reply indicator**
`translateX` is a shared value updated directly in the gesture handler's `onUpdate` callback on the UI thread. `withSpring` snaps it back to 0 on gesture end. The reply icon opacity is derived from `translateX` via `useAnimatedStyle` — no JS bridge involved.

**Emoji bar entrance**
`emojiBarScale` (starts at `0.7`) and `emojiBarOpacity` (starts at `0`) spring to `1` when a long press is detected. On dismiss, they spring back and `runOnJS` unmounts the component after the animation settles, avoiding a flash of invisible content.

**RatingOverlay card**
A `cardScale` shared value springs from `0.85 → 1` on mount, giving the rating card a natural pop-in feel. Each star button has its own `scale` shared value that bounces to `1.3` on press then back to `1`.

**FeedbackChips in RatingOverlay**
Chip opacity animates from `0 → 1` with a spring on mount, giving a smooth reveal after the dislike button is tapped.

---

## Gesture Handling Approach

All gesture logic uses **React Native Gesture Handler (RNGH)** via the `Gesture` API and `GestureDetector`.

**Key challenge — gesture + touchable conflict**
RNGH's `GestureDetector` and React Native's `TouchableOpacity` run on separate touch responder systems. Any `TouchableOpacity` nested inside a `GestureDetector` will have its taps swallowed by the gesture handler. This was the most significant architectural constraint.

**Solution — strict separation**
Every interactive element (like/dislike buttons, emoji bar, feedback chips) is rendered as a **sibling** of `GestureDetector`, never a child. Only the bubble's animated transform lives inside it.

**Composed gestures on the bubble**
The bubble uses `Gesture.Simultaneous(panGesture, longPressGesture)` so both can be active at once — swiping right triggers reply, holding triggers the emoji bar — without either cancelling the other.

```
<View>                            ← messageColumn
  <GestureDetector                ← pan + longPress composed
    gesture={Gesture.Simultaneous(pan, longPress)}>
    <Animated.View>               ← translateX applied here
      <MessageBubble />
    </Animated.View>
  </GestureDetector>

  <EmojiBar />                    ← sibling, TouchableOpacity works fine
  <ReactionBadge />               ← sibling
  <LikeDislikeRow />              ← sibling
  <FeedbackChips />               ← sibling
</View>
```

**Pan gesture configuration**
`activeOffsetX([15, 9999])` ensures the gesture only activates on rightward horizontal movement. `failOffsetY([-8, 8])` cancels the gesture if vertical scroll is detected first, so the `FlatList` scroll and swipe-to-reply never conflict.

---

## State Management

**No external state library was used.** All state is managed with React's built-in `useState`, scoped to the component that owns it.

**Rationale:**
This is a single-screen UI with no shared state between unrelated components. The data flow is simple and local:

- `ChatScreen` owns the message list, reply target, and overlay visibility — state that multiple children need.
- `SwipeableMessage` owns its own feedback type, chip selection, emoji bar visibility, and reaction — all purely local to one message row.

Redux or Zustand would add indirection and boilerplate without any benefit at this scope. If the app were to grow (e.g., persisting reactions to a server, syncing feedback across sessions, multi-screen navigation), Redux or Zustand would be the natural next step as they works well with React Native.
