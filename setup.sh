#!/bin/bash

# PhotoPicks - Setup Script
# This script helps you set up the project after pulling the latest updates

set -e  # Exit on error

echo "🚀 PhotoPicks Setup Script"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if node is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Version 18+ is recommended."
fi

print_success "Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

print_success "npm $(npm -v) detected"

echo ""
echo "📦 Step 1: Cleaning previous installation..."
echo "-------------------------------------------"

# Remove node_modules
if [ -d "node_modules" ]; then
    print_info "Removing node_modules..."
    rm -rf node_modules
    print_success "node_modules removed"
else
    print_info "No node_modules directory found (skipping)"
fi

# Remove package-lock.json
if [ -f "package-lock.json" ]; then
    print_info "Removing package-lock.json..."
    rm package-lock.json
    print_success "package-lock.json removed"
fi

# Remove yarn.lock if exists
if [ -f "yarn.lock" ]; then
    print_info "Removing yarn.lock..."
    rm yarn.lock
    print_success "yarn.lock removed"
fi

echo ""
echo "📥 Step 2: Installing dependencies..."
echo "-------------------------------------"
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "🧹 Step 3: Clearing caches..."
echo "----------------------------"

# Clear Metro cache
print_info "Clearing Metro bundler cache..."
npx expo start --clear &>/dev/null &
EXPO_PID=$!
sleep 2
kill $EXPO_PID 2>/dev/null || true
print_success "Metro cache cleared"

# Clear watchman cache if available
if command -v watchman &> /dev/null; then
    print_info "Clearing Watchman cache..."
    watchman watch-del-all &>/dev/null || true
    print_success "Watchman cache cleared"
else
    print_info "Watchman not installed (skipping)"
fi

echo ""
echo "🔨 Step 4: Rebuilding native projects..."
echo "----------------------------------------"

print_info "Running expo prebuild (this may take a few minutes)..."
npx expo prebuild --clean

if [ $? -eq 0 ]; then
    print_success "Native projects rebuilt successfully"
else
    print_error "Failed to rebuild native projects"
    print_warning "You may need to run this manually: npx expo prebuild --clean"
fi

# iOS specific steps (only on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 Step 5: iOS Setup (macOS only)..."
    echo "------------------------------------"
    
    if [ -d "ios" ]; then
        print_info "Installing iOS pods..."
        cd ios
        
        if command -v pod &> /dev/null; then
            pod install
            if [ $? -eq 0 ]; then
                print_success "iOS pods installed successfully"
            else
                print_error "Failed to install pods"
                print_warning "You may need to run 'pod install' manually in the ios directory"
            fi
        else
            print_warning "CocoaPods not installed. Install it with: sudo gem install cocoapods"
        fi
        
        cd ..
    else
        print_info "No ios directory found (will be created by prebuild)"
    fi
else
    print_info "Not running on macOS - skipping iOS setup"
fi

# Android specific steps
echo ""
echo "🤖 Step 6: Android Setup..."
echo "---------------------------"

if [ -d "android" ]; then
    print_info "Cleaning Android build..."
    cd android
    
    if [ -f "gradlew" ]; then
        chmod +x gradlew
        ./gradlew clean
        if [ $? -eq 0 ]; then
            print_success "Android build cleaned successfully"
        else
            print_warning "Android clean had some issues, but continuing..."
        fi
    fi
    
    cd ..
else
    print_info "No android directory found (will be created by prebuild)"
fi

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Start the development server:"
echo "   npm start"
echo ""
echo "2. Run on iOS (macOS only):"
echo "   npm run ios"
echo ""
echo "3. Run on Android:"
echo "   npm run android"
echo ""
echo "4. Run tests:"
echo "   npm test"
echo ""
echo "5. Check for type errors:"
echo "   npm run typecheck"
echo ""
echo "6. Check code quality:"
echo "   npm run lint"
echo ""
print_success "Happy coding! 🎉"
