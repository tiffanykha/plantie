import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Plus, Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { Dimensions, FlatList, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlantCard } from '../src/components/PlantCard';
import { useAuthStore } from '../src/store/useAuthStore';
import { usePlantStore } from '../src/store/usePlantStore';
import { theme } from '../src/theme';

export default function HomeScreen() {
    const user = useAuthStore((state) => state.user);
    const plants = usePlantStore((state) => state.plants);
    const thirstyCount = plants.filter((p) => p.status === 'thirsty').length;
    const { width, height } = Dimensions.get('window');

    // Floating animation setup
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <Animated.View style={animatedStyle}>
                <Image
                    source={require('../assets/images/empty_pot.png')}
                    style={styles.emptyIllustration}
                    contentFit="contain"
                />
            </Animated.View>
            <Text style={styles.emptyTitle}>Your indoor jungle awaits!</Text>
            <Text style={styles.emptySubtitle}>Tap the button below to add your first plant to Plantie.</Text>

            <Link href="/add-plant" asChild>
                <Pressable style={({ pressed }) => [styles.emptyStateButton, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                    <Plus color="#FFF" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.emptyStateButtonText}>Add Your First Plant</Text>
                </Pressable>
            </Link>
        </View>
    );

    const sortedPlants = [...plants].sort((a, b) => a.species.localeCompare(b.species));

    const renderFooter = () => {
        if (plants.length === 0) return null;
        return (
            <Link href="/add-plant" asChild>
                <Pressable style={({ pressed }) => [styles.addCardContainer, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                    <BlurView intensity={80} tint="light" style={styles.addCardButton}>
                        <View style={styles.addCardIconContainer}>
                            <Plus color={theme.colors.primary} size={24} />
                        </View>
                        <Text style={styles.addCardText}>Add New Plant</Text>
                    </BlurView>
                </Pressable>
            </Link>
        );
    };

    // Calculate dynamic time of day greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const displayName = user?.user_metadata?.displayName || 'Friend';

    return (
        <ImageBackground
            source={require('../assets/images/green_tie_dye_bg.png')}
            style={[styles.background, { width, height }]}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()}, {displayName}</Text>
                        <Text style={styles.subtitle}>
                            {thirstyCount === 0
                                ? 'All your plants are healthy.'
                                : `You have ${thirstyCount} plant${thirstyCount > 1 ? 's' : ''} that need${thirstyCount === 1 ? 's' : ''} water.`}
                        </Text>
                    </View>
                    <Link href="/settings" asChild>
                        <Pressable style={styles.settingsButton}>
                            <Settings color={theme.colors.text} size={24} />
                        </Pressable>
                    </Link>
                </View>

                <FlatList
                    data={sortedPlants}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <PlantCard {...item} />}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                    contentContainerStyle={[styles.list, plants.length === 0 && { flex: 1, justifyContent: 'center' }]}
                    showsVerticalScrollIndicator={false}
                />

                <Link href="/add-plant" asChild>
                    <Pressable style={({ pressed }) => [styles.fab, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
                        <Plus color="#FFF" size={24} />
                    </Pressable>
                </Link>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 60, // Editorial top spacing
        paddingBottom: theme.spacing.lg,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm
    },
    greeting: {
        fontSize: 28,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.textSecondary,
    },
    list: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: 100, // Space for FAB
        gap: 16, // Increase vertical gap between cards
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        marginTop: -100, // Offset visual center slightly up due to FAB
    },
    emptyIllustration: {
        width: 250,
        height: 250,
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: theme.spacing.xl,
    },
    emptyStateButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: theme.borderRadius.round,
        ...theme.shadows.md,
    },
    emptyStateButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: theme.typography.fontFamily.bold,
    },
    addCardContainer: {
        marginBottom: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Slightly transparent white fallback
        ...theme.shadows.sm,
    },
    addCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    addCardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    addCardText: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamily.semiBold,
        color: theme.colors.text,
    },
});


