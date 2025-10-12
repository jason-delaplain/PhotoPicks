# 🚀 Quick Start Guide

Get PhotoPicks up and running in 5 minutes!

## 📋 Prerequisites

- ✅ Node.js 18+ installed
- ✅ npm or yarn installed
- ✅ Git installed
- ✅ iOS Simulator (macOS) or Android Emulator

## ⚡ Fast Setup (Recommended)

### Option 1: Using Setup Script

```bash
# Clone the repository
git clone https://github.com/jason-delaplain/PhotoPicks.git
cd PhotoPicks

# Make setup script executable and run it
chmod +x setup.sh
./setup.sh

# Start development server
npm start
```

The script will:
- Clean old dependencies
- Install fresh packages
- Clear all caches
- Rebuild native projects
- Set up iOS pods (macOS only)
- Clean Android builds

### Option 2: Manual Setup

```bash
# 1. Clone and navigate
git clone https://github.com/jason-delaplain/PhotoPicks.git
cd PhotoPicks

# 2. Install dependencies
npm install

# 3. Prebuild native projects
npx expo prebuild --clean

# 4. iOS Setup (macOS only)
cd ios && pod install && cd ..

# 5. Start the app
npm start
```

## 📱 Running the App

### Development Server

```bash
# Start Expo dev server
npm start

# Then choose:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app
```

### Direct Platform Launch

```bash
# iOS (macOS only)
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🧪 Verify Installation

Run these commands to ensure everything is set up correctly:

```bash
# Type checking (should show no errors)
npm run typecheck

# Linting (should pass with no errors)
npm run lint

# Tests (should all pass)
npm test
```

## 🔧 Common Issues & Quick Fixes

### Metro Bundler Won't Start

```bash
npx expo start --clear
```

### "Cannot find module" Error

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Fails

```bash
# Clean everything and start fresh
./setup.sh
# or
npx expo prebuild --clean
```

### iOS Build Issues (macOS)

```bash
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### TypeScript Errors After Update

The stricter settings may reveal issues. Fix by:
1. Adding proper type annotations
2. Handling null/undefined values
3. Using type guards

## 📚 Next Steps

1. **Read the docs**: Check out `README.md` for features
2. **Explore the code**: Start with `App.tsx` and `src/components/`
3. **Run on device**: Follow Expo's device setup guide
4. **Start developing**: See `CONTRIBUTING.md` for guidelines

## 🆘 Need Help?

- 📖 **Documentation**: Check `README.md` and `UPGRADE_GUIDE.md`
- 🐛 **Issues**: [GitHub Issues](https://github.com/jason-delaplain/PhotoPicks/issues)
- 💬 **Questions**: deladroid@gmail.com

## 🎯 Development Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/my-feature

# 2. Make changes and test
npm test
npm run typecheck
npm run lint

# 3. Commit your changes
git commit -m "feat: add my feature"

# 4. Push and create PR
git push origin feature/my-feature
```

## 📊 Useful Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server |
| `npm run ios` | Run on iOS |
| `npm run android` | Run on Android |
| `npm test` | Run tests |
| `npm run typecheck` | Check TypeScript |
| `npm run lint` | Check code quality |
| `npm run prebuild` | Generate native code |
| `npm run prebuild:clean` | Clean rebuild |

## 🎉 You're Ready!

PhotoPicks is now set up and ready for development. Happy coding! 📸

---

**Pro Tip**: Bookmark this guide for quick reference!
