import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LandingPageProps {
  onFeatureSelect: (feature: 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'favorites' | 'similar') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFeatureSelect }) => {
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
  ];

  const renderIcon = (iconType: string, iconName: string) => {
    const props = {
      name: iconName as any,
      size: 32,
      color: '#4dabf7'
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="camera" size={40} color="#4dabf7" style={styles.titleIcon} />
          <Text style={styles.title}>PhotoPicks</Text>
        </View>
        <Text style={styles.subtitle}>AI-Powered Photo Organization</Text>
        <Text style={styles.description}>
          Organize your photos with smart AI assistance
        </Text>
      </View>

      {/* Main Swipe Button */}
      <TouchableOpacity 
        style={styles.mainButton}
        onPress={() => onFeatureSelect('swipe')}
      >
        <View style={styles.mainButtonContent}>
          <Ionicons name="finger-print" size={48} color="#ffffff" style={styles.mainButtonIcon} />
          <Text style={styles.mainButtonTitle}>Swipe Photos</Text>
          <Text style={styles.mainButtonSubtitle}>Swipe through all your photos</Text>
        </View>
      </TouchableOpacity>

      {/* Feature Options */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Smart Features</Text>
        <Text style={styles.sectionSubtitle}>AI-powered photo analysis & organization</Text>
      </View>

      <View style={styles.featuresGrid}>
        {mainFeatures.map((feature, index) => (
          <TouchableOpacity 
            key={feature.id}
            style={styles.featureCard}
            onPress={() => onFeatureSelect(feature.id as any)}
          >
            {renderIcon(feature.iconType, feature.iconName)}
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Ionicons name="sparkles" size={16} color="#4dabf7" style={styles.footerIcon} />
          <Text style={styles.footerText}>
            Start with "Swipe Photos" to quickly organize your entire gallery, or choose a specific feature for targeted cleanup
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a', // Deep navy blue background
  },
  content: {
    paddingHorizontal: 20,
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
    color: '#4dabf7', // Light blue accent
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Main Swipe Button
  mainButton: {
    backgroundColor: '#4263eb', // Camera-inspired blue
    borderRadius: 20,
    marginBottom: 40,
    elevation: 8,
    shadowColor: '#4263eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    color: '#74c0fc',
    textAlign: 'center',
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 4, // Small padding to prevent edge touching
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
