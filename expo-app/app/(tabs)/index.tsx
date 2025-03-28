import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { ArrowRight, Star } from 'lucide-react-native';

const FEATURED_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';

interface FeatureCardProps {
  title: string;
  description: string;
  onPress: () => void;
}

function FeatureCard({ title, description, onPress }: FeatureCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <Star size={24} color="#007AFF" style={styles.cardIcon} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <ArrowRight size={20} color="#8E8E93" />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>Demo App</Text>
      </View>

      <Image
        source={{ uri: FEATURED_IMAGE }}
        style={styles.featuredImage}
        resizeMode="cover"
      />

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Featured</Text>
        
        <FeatureCard
          title="Discover"
          description="Explore our curated collection of amazing experiences"
          onPress={() => {}}
        />
        
        <FeatureCard
          title="Connect"
          description="Join our community of passionate individuals"
          onPress={() => {}}
        />
        
        <FeatureCard
          title="Create"
          description="Start your journey and build something amazing"
          onPress={() => {}}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuresSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
});