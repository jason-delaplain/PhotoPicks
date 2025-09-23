import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Simple visible build tag to confirm the latest bundle is loaded on device
const BUILD_TAG = 'Build: Sep 22, 2025 9:55p';

interface LandingPageProps {
  onFeatureSelect: (feature: 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'favorites' | 'similar' | 'debug') => void;
}

const LandingPage = (props: LandingPageProps) => {
  const { onFeatureSelect } = props;
  const mainFeatures = [
    { 
      id: 'blurry', 
      iconType: 'MaterialIcons',
      iconName: 'blur-on',
      title: 'Blurry Photos', 
      subtitle: 'Find & remove blurred images' 
    },
    { 
      id: 'duplicates', 
      iconType: 'MaterialIcons',
      iconName: 'content-copy',
      title: 'Duplicates', 
      subtitle: 'Detect similar photos' 
    },
    { 
      id: 'keyword', 
      iconType: 'Ionicons',
      iconName: 'search',
      title: 'Keyword Search', 
      subtitle: 'Find photos by content' 
    },
    { 
      id: 'color', 
      iconType: 'MaterialIcons',
      iconName: 'palette',
      title: 'Color Sorting', 
      subtitle: 'Organize by color palette' 
    },
    { 
      id: 'favorites', 
      iconType: 'Ionicons',
      iconName: 'heart',
      title: 'Favorites', 
      subtitle: 'Mark your best shots' 
    },
    { 
      id: 'similar', 
      iconType: 'MaterialIcons',
      iconName: 'compare',
      title: 'Similar Images', 
      subtitle: 'Group related photos' 
    },
    {
      id: 'debug',
      iconType: 'Ionicons',
      iconName: 'bug',
      title: 'Dev Tools',
      subtitle: 'Run diagnostics & debug utilities'
    }
  ];

  const renderIcon = (iconType: string, iconName: string) => {
    const props = {
      name: iconName as any,
      size: 32,
      color: '#7c3aed'
    };

    switch (iconType) {
      case 'Ionicons':
        return <Ionicons {...props} />;
      case 'MaterialIcons':
        return <MaterialIcons {...props} />;
      case 'FontAwesome5':
        return <FontAwesome5 {...props} />;
      default:
        return <Ionicons {...props} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="camera" size={40} color="#7c3aed" style={styles.titleIcon} />
          <Text style={styles.title}>PhotoPicks</Text>
        </View>
  <Text style={styles.subtitle}>Advanced Photo Organization</Text>
  <Text style={styles.buildTag}>{BUILD_TAG}</Text>
        <Text style={styles.description}>
          Organize your photos with smart tools
        </Text>
      </View>

      {/* Main Swipe Button */}
      <TouchableOpacity 
        style={styles.mainButton}
        onPress={() => onFeatureSelect('swipe')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#4f46e5", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainButtonGradient}
        >
          <View style={styles.mainButtonContent}>
            <Ionicons name="swap-horizontal" size={48} color="#ffffff" style={styles.mainButtonIcon} />
            <Text style={styles.mainButtonTitle}>Swipe Photos</Text>
            <Text style={styles.mainButtonSubtitle}>Swipe through all your photos</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Feature Options */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Smart Features</Text>
        <Text style={styles.sectionSubtitle}>Super-powered photo analysis & organization</Text>
      </View>

      <View style={styles.featuresGrid}>
        {mainFeatures.map((feature, index) => (
          <TouchableOpacity 
            key={feature.id}
            style={styles.featureCard}
            onPress={() => onFeatureSelect(feature.id as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.9}
          >
            {renderIcon(feature.iconType, feature.iconName)}
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Ionicons name="sparkles" size={16} color="#7c3aed" style={styles.footerIcon} />
          <Text style={styles.footerText}>
            Start with "Swipe Photos" to quickly organize your entire gallery, or choose a specific feature for targeted cleanup
          </Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a', // Deep navy blue background
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 18,
    color: '#7c3aed', // CTA gradient endpoint accent
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 24,
  },
  buildTag: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  
  // Main Swipe Button
  mainButton: {
    borderRadius: 20,
    marginBottom: 40,
    elevation: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  mainButtonGradient: {
    borderRadius: 20,
  },
  mainButtonContent: {
    padding: 32,
    alignItems: 'center',
  },
  mainButtonIcon: {
    marginBottom: 12,
  },
  mainButtonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  mainButtonSubtitle: {
    fontSize: 16,
    color: '#c5dbff',
    textAlign: 'center',
  },

  // Section Headers
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#a78bfa',
    textAlign: 'center',
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 0,
  },
  featureCard: {
    width: '48%', // Each card takes 48% width, leaving 4% for spacing
    backgroundColor: '#1a202c', // Dark card background
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748', // Subtle border
    minHeight: 140,
    justifyContent: 'center',
    marginBottom: 12, // Space between rows
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 12,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Footer
  footer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#1a202c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  footerText: {
    fontSize: 14,
    color: '#a0aec0',
    lineHeight: 20,
    flex: 1,
  },
});

export default LandingPage;
