import { Camera, CloudRain, Droplets, History, Sparkles, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { PlantLog } from '../store/usePlantStore';
import { theme } from '../theme';

interface PlantHistoryItemProps {
    log: PlantLog;
    isLast: boolean;
    onDelete: (logId: string) => void;
}

export const PlantHistoryItem = React.memo(({ log, isLast, onDelete }: PlantHistoryItemProps) => {
    let Icon = History;
    let bgColor = '#8D6E63';
    let title = log.note || 'Action Logged';

    if (log.action === 'watered') {
        Icon = Droplets;
        bgColor = '#34A853'; // Green
        title = 'Watered';
    } else if (log.action === 'misted') {
        Icon = CloudRain;
        bgColor = '#2196F3'; // Blue
        title = 'Misted';
    } else if (log.action === 'fertilized') {
        Icon = Sparkles;
        bgColor = '#FFB020'; // Orange/Yellow
        title = 'Fertilized';
    }

    if (log.action === 'photo_added') {
        Icon = Camera;
        bgColor = '#9C27B0'; // Purple
        title = 'New Photo Added';
    }

    const renderRightActions = () => {
        return (
            <View style={styles.swipeDeleteContainer}>
                <Pressable
                    style={styles.swipeDeleteButton}
                    onPress={() => onDelete(log.id)}
                    hitSlop={12}
                >
                    <Trash2 color="#FFF" size={20} />
                </Pressable>
            </View>
        );
    };

    return (
        <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
            <View style={styles.timelineNode}>
                <View style={styles.timelineLineContainer}>
                    <View style={[styles.historyIcon, { backgroundColor: bgColor }]}>
                        <Icon color="#FFF" size={16} />
                    </View>
                    {/* Only draw a line if it's not the last item */}
                    {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.historyTextContent}>
                    <Text style={styles.historyTitle}>{title}</Text>
                    <Text style={styles.historyDate}>
                        {new Date(log.date).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </Swipeable>
    );
});

const styles = StyleSheet.create({
    timelineNode: { flexDirection: 'row', minHeight: 60 },
    timelineLineContainer: { alignItems: 'center', marginRight: theme.spacing.md, height: '100%' },
    historyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#34A853', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    timelineLine: { width: 2, flex: 1, backgroundColor: theme.colors.border, position: 'absolute', top: 36, bottom: 0, zIndex: 1 },
    historyTextContent: { flex: 1, paddingBottom: 20 },
    historyTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.text },
    historyDate: { fontSize: 14, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, marginTop: 2 },
    swipeDeleteContainer: { justifyContent: 'center', alignItems: 'center', width: 80, paddingBottom: 20 },
    swipeDeleteButton: { width: 44, height: 44, backgroundColor: '#FF3B30', borderRadius: theme.borderRadius.md, justifyContent: 'center', alignItems: 'center' },
});
