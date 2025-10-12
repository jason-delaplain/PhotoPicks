# 📸 PhotoPicks - AI-Powered Photo Organization

*Photo swiping inspired device image management.*

[![React Native](https://img.shields.io/badge/React%20Native-0.76.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.13-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

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

### 🎯 Key Features

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

## 🛠️ Tech Stack

- **Framework**: React Native 0.76.5
- **Runtime**: Expo SDK 54
- **Language**: TypeScript 5.9.2
- **UI Components**: React Native core components
- **Gestures**: React Native Gesture Handler
- **Navigation**: Safe Area Context
- **Testing**: Jest with jest-expo
- **Linting**: ESLint with React Native Community config
- **Formatting**: Prettier

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jason-delaplain/PhotoPicks.git
   cd PhotoPicks
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Prebuild native projects** (if running on device/emulator)
   ```bash
   npx expo prebuild --clean
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

## 📱 Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📱 How to Use

### Getting Started
1. **Scan the QR code** with Expo Go app or iPhone camera
2. **Choose your preferred mode** from the landing page
3. **Start organizing** your photos immediately

### Swipe Mode
1. Tap "Swipe Mode" from the landing page
2. **Swipe gestures**: Left to delete, right to keep
3. **Button controls**: Tap Delete/Edit/Keep buttons
4. **Edit photos**: Tap "Edit" to open in external app
5. **Track progress**: View real-time statistics in header
6. **Visual feedback**: Watch indicators during swipes

### Blurry Photos Mode
1. Tap "Blurry Photos" from the landing page
2. Adjust sensitivity slider to detect blurry images
3. Select multiple photos for bulk deletion
4. Pull down to refresh the photo library

### Navigation
- **Back buttons** available in all screens
- **Progress tracking** with photo counters
- **Completion screens** with final statistics
- **Mode switching** from any screen

### Refresh & Caching
- The app uses a fast, in-memory cache of your photo library for both Swipe and Blurry modes.
- It won't rescan automatically while you use the app; instead it reads from this cache for snappy navigation.
- To rescan/refresh the library:
  - In Swipe mode, tap the "Refresh" button in the header.
  - In Blurry mode, pull down to refresh.
- When you delete photos from within the app, the cache is pruned immediately so counts stay accurate.
- The cache is in-memory only and resets when the app restarts.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📦 Project Structure

```
PhotoPicks/
├── src/
│   ├── components/      # React components
│   │   ├── LandingPage.tsx
│   │   ├── SwipePhotoSwiper.tsx
│   │   ├── BlurryPhotos.tsx
│   │   └── ...
│   ├── services/        # AI and native services
│   ├── utils/          # Utility functions
│   ├── monitoring/     # Error tracking (Sentry)
│   └── assets/         # Images and resources
├── android/            # Android native code
├── ios/               # iOS native code
├── __tests__/         # Test files
└── coverage/          # Test coverage reports
```

## 🔮 Future Enhancements

### Planned Features
- **Advanced AI features**:
  - Enhanced blur and quality detection
  - Duplicate photo identification
  - Face recognition and grouping
  - Smart categorization
  - Location-based organization
- **Real camera roll integration** (requires device permissions)
- **Photo editing suite** with built-in tools
- **Cloud synchronization** for cross-device access
- **Batch operations** for faster organization
- **Custom categories** and tagging system

### Technical Improvements
- **Performance optimization** for large photo libraries
- **Offline functionality** with local storage
- **Background processing** for AI analysis
- **Export/import** functionality
- **Advanced animations** and transitions

## 📄 Recent Updates

### Version 1.0.0 (October 2025)

- ✅ Updated React Native to 0.76.5
- ✅ Updated React to 18.3.1 for Expo SDK 54 compatibility
- ✅ Added comprehensive Jest configuration
- ✅ Enabled strict TypeScript settings
- ✅ Added ESLint and Prettier configurations
- ✅ Configured path aliases (@/* imports)
- ✅ Updated Android to use New Architecture
- ✅ Enabled Hermes engine for better performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- UI inspired by modern photo management apps
- AI capabilities powered by on-device ML models

## 📞 Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/jason-delaplain/PhotoPicks/issues)
- Contact: deladroid@gmail.com

---

**PhotoPicks** - Making photo organization intuitive, fast, and enjoyable! 📸✨

Made with ❤️ by Jason Delaplain
