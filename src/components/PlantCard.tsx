import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Droplets, Leaf, Waves } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface PlantCardProps {
    id: string;
    name: string;
    species: string;
    status: 'healthy' | 'thirsty' | 'critical' | 'overwatered';
    photos?: string[];
}

export const PlantCard = React.memo(
    function PlantCardComponent({ id, name, species, status, photos }: PlantCardProps) {
        const isThirsty = status === 'thirsty';
        const isOverwatered = status === 'overwatered';

        let statusText = 'Healthy';
        let StatusIcon = Droplets;
        let statusColor = theme.colors.status.healthy;
        let statusBgColor = theme.colors.primaryLight;

        if (isThirsty) {
            statusText = 'Needs Water';
            statusColor = theme.colors.status.thirsty;
            statusBgColor = '#FFF0E6';
        } else if (isOverwatered) {
            statusText = 'Overwatered';
            StatusIcon = Waves;
            statusColor = '#005BBB';
            statusBgColor = '#E6F0FF';
        }

        return (
            <Link href={`/plant/${id}`} asChild>
                <Pressable style={({ pressed }) => [styles.cardContainer, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                    <BlurView intensity={80} tint="light" style={styles.card}>
                        {photos && photos.length > 0 ? (
                            <Image source={{ uri: photos[0] }} style={styles.imagePlaceholder} contentFit="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Leaf color={theme.colors.primaryLight} size={48} />
                            </View>
                        )}
                        <View style={styles.content}>
                            <Text style={styles.name}>{name}</Text>
                            <Text style={styles.species}>{species}</Text>

                            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                                <StatusIcon color={statusColor} size={14} />
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {statusText}
                                </Text>
                            </View>
                        </View>
                    </BlurView>
                </Pressable>
            </Link>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.id === nextProps.id &&
            prevProps.name === nextProps.name &&
            prevProps.status === nextProps.status &&
            prevProps.photos === nextProps.photos
        );
    });

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Slightly transparent white fallback
        shadowColor: '#1B4D3E',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    card: {
        padding: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamily.semiBold,
        color: theme.colors.text,
        marginBottom: 2,
    },
    species: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: theme.borderRadius.round,
        alignSelf: 'flex-start',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontFamily: theme.typography.fontFamily.medium,
    },
});
