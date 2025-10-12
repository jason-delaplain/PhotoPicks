# PhotoPicks - AI-Powered Photo Organization

*Photo swiping inspired device image management.*

A modern React Native app built with Expo for organizing and managing your photo collection with AI-powered features.

## 🚀 Features

### 📱 Modes

#### Swipe Mode
- **Gesture-based photo sorting** with smooth animations
- Swipe left to delete, right to keep
- **Stack-based photo preview** showing next photo behind current
- **Three-button action bar**: Delete, Edit, Keep
- **Real-time statistics** tracking kept/deleted counts
- **Visual feedback** with dynamic indicators
- **Enhanced navigation** with back button functionality
- **Photo information** display with filename overlay

#### Blurry Photos
- Detects blurry images using a fast thumbnail heuristic
- Adjustable sensitivity with a simple slider
- Select multiple and bulk delete

<!-- Favorites feature removed for now -->

### 🎯 Key Improvements

#### Navigation
- ✅ **Functional back buttons** in all modes
- ✅ **Mode switching** from landing page
- ✅ **Header navigation** with current photo count
- ✅ **Completion screens** with statistics

#### Swipe Mode Enhancements
- ✅ **Three-way actions**: Keep, Delete, Edit
- ✅ **Button-based controls** as alternative to swiping
- ✅ **Photo stack visualization** with next photo preview
- ✅ **Real-time statistics** tracking
- ✅ **Enhanced animations** with rotation and scaling
- ✅ **Visual feedback** during swipe gestures
- ✅ **Filename display** for better photo identification
- ✅ **Edit functionality** with external app integration

#### User Experience
- ✅ **Smooth animations** throughout the app
- ✅ **Responsive design** for various screen sizes
- ✅ **Accessibility features** with large touch targets
- ✅ **Visual feedback** for all interactions
- ✅ **Progress tracking** with completion statistics

## 🛠 Technical Implementation

### Architecture
- **Expo SDK** for cross-platform development
- **TypeScript** for type safety
- **React Native Animated API** for smooth animations
- **PanResponder** for gesture handling
- **Modular component structure** for maintainability

### Components
- `LandingPage.tsx` - Feature selection and app introduction
- `SwipePhotoSwiper.tsx` - Gesture-based organization
- `BlurryPhotos.tsx` - Blurry photo detection and cleanup

### Data
- Operates on the device photo library via Expo MediaLibrary

## 📱 How to Use

### Getting Started
1. **Scan the QR code** with Expo Go app or iPhone camera
2. **Choose your preferred mode** from the landing page
3. **Start organizing** your photos immediately

### Simple Mode
1. Tap "Simple Mode" from the landing page
2. Use "Keep ✅" or "Delete ❌" buttons
3. View progress counter and navigate back anytime

### Swipe Mode
1. Tap "Swipe Mode" from the landing page
2. **Swipe gestures**: Left to delete, right to keep
3. **Button controls**: Tap Delete/Edit/Keep buttons
4. **Edit photos**: Tap "Edit" to open in external app
5. **Track progress**: View real-time statistics in header
6. **Visual feedback**: Watch indicators during swipes

### Navigation
- **Back buttons** available in all screens
- **Progress tracking** with photo counters
- **Completion screens** with final statistics
- **Mode switching** from any screen

### Refresh & caching
- The app uses a fast, in-memory cache of your photo library for both Swipe and Blurry modes.
- It won’t rescan automatically while you use the app; instead it reads from this cache for snappy navigation.
- To rescan/refresh the library:
  - In Swipe mode, tap the “Refresh” button in the header.
  - In Blurry mode, pull down to refresh.
- When you delete photos from within the app, the cache is pruned immediately so counts stay accurate.
- The cache is in-memory only and resets when the app restarts.

## 🔮 Future Enhancements

### Planned Features
- **Real camera roll integration** (requires device permissions)
- **Photo editing suite** with built-in tools
- **Cloud synchronization** for cross-device access
- **Batch operations** for faster organization
- **Custom categories** and tagging system
- **AI-powered features**:
  - Blur and quality detection
  - Duplicate photo identification
  - Face recognition and grouping
  - Smart categorization
  - Location-based organization

### Technical Improvements
- **Performance optimization** for large photo libraries
- **Offline functionality** with local storage
- **Background processing** for AI analysis
- **Export/import** functionality
- **Advanced animations** and transitions

## 🧪 Testing

### Current Testing Setup
- **Real device testing** on iOS and Android

### Test Scenarios
1. **Navigation flow** between all modes
2. **Gesture recognition** in swipe mode
3. **Button interactions** in all modes
4. **Statistics tracking** accuracy
5. **Animation performance** on various devices
6. **Edit functionality** modal behavior

## 🚀 Development

### Setup
```bash
npm install
npx expo start
```

### Building for Native Platforms

#### Android
```bash
# Build Android APK
npm run android:gradle

# Run on Android device/emulator
npm run android
```

#### iOS
```bash
# Install CocoaPods dependencies
npm run ios:pods

# Run on iOS device/simulator
npm run ios
```

### Prebuild Sync Process

This project uses Expo Prebuild to manage native Android and iOS folders. When native folders are present, configuration in `app.json` needs to be synced to native projects:

```bash
# Sync app.json configuration to native projects
npm run prebuild

# Or using npx directly
npx expo prebuild
```

**Important**: After modifying `app.json` (icon, splash screen, permissions, etc.), run `npx expo prebuild` to sync changes to the native Android and iOS projects.

### Common Issues & Workarounds

#### Watchman Issues
If you encounter file watching issues during development:

```bash
# Restart watchman
watchman shutdown-server
watchman watch-del-all

# Then restart Expo
npm start
```

#### Clearing Metro Cache
```bash
npx expo start --clear
```

### Key Dependencies
- `expo` - Cross-platform development framework
- `react-native` - Core mobile app framework
- `expo-font` - Font loading support (required by @expo/vector-icons)
- `@types/react-native` - TypeScript definitions

### Project Structure
```
PhotoPicksExpo/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx
│   │   ├── SwipePhotoSwiper.tsx
│   │   ├── BlurryPhotos.tsx
│   │   
│   └── utils/
│       └── resolveMediaUri.ts
├── App.tsx
└── package.json
```

## 📊 Current Status

### ✅ Completed Features
- [x] Landing page with mode selection
- [x] Swipe mode with gestures
- [x] Blurry photo detection workflow
<!-- Favorites management removed for now -->
- [x] Visual feedback and animations
- [x] Cross-platform compatibility

### 🔄 In Progress
- [ ] Advanced photo editing features
- [ ] AI-powered photo analysis

### 📋 Backlog
- [ ] Cloud synchronization
- [ ] Advanced categorization
- [ ] Batch operations
- [ ] Performance optimization for large libraries

---

**PhotoPicks** - Making photo organization intuitive, fast, and enjoyable! 📸✨
