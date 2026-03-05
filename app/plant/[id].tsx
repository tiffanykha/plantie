import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, CloudRain, Droplets, Lightbulb, Pencil, Sparkles, Sun, Trash2, Waves } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlantHistoryItem } from '../../src/components/PlantHistoryItem';
import { DeletePlantModal } from '../../src/components/modals/DeletePlantModal';
import { RenamePlantModal } from '../../src/components/modals/RenamePlantModal';
import { usePlantStore } from '../../src/store/usePlantStore';
import { theme } from '../../src/theme';

export default function PlantDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isRenameModalVisible, setRenameModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [customTip, setCustomTip] = useState('');

    const plant = usePlantStore((state) => state.plants.find((p) => p.id === id));
    const waterPlant = usePlantStore((state) => state.waterPlant);
    const addPhoto = usePlantStore((state) => state.addPhoto);
    const removePlant = usePlantStore((state) => state.removePlant);
    const renamePlant = usePlantStore((state) => state.renamePlant);
    const logCareAction = usePlantStore((state) => state.logCareAction);
    const removeLog = usePlantStore((state) => state.removeLog);
    const updatePlantStatus = usePlantStore((state) => state.updatePlantStatus);
    const diagnosePlant = usePlantStore((state) => state.diagnosePlant);

    if (!plant) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text>Plant not found.</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const handleWater = () => {
        waterPlant(plant.id);
    };

    const handleMist = () => {
        logCareAction(plant.id, 'misted', 'Light misting');
    };

    const handleFertilize = () => {
        logCareAction(plant.id, 'fertilized', 'Applied liquid fertilizer');
    };

    const handleUpdatePhoto = async () => {
        Alert.alert(
            'Add Photo',
            'Choose a source',
            [
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const permission = await ImagePicker.requestCameraPermissionsAsync();
                        if (!permission.granted) {
                            Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.8,
                        });
                        if (!result.canceled && result.assets?.[0]) {
                            addPhoto(plant.id, result.assets[0].uri);
                        }
                    },
                },
                {
                    text: 'Choose from Library',
                    onPress: async () => {
                        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permission.granted) {
                            Alert.alert('Permission Required', 'Photo library access is needed to pick a photo.');
                            return;
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.8,
                        });
                        if (!result.canceled && result.assets?.[0]) {
                            addPhoto(plant.id, result.assets[0].uri);
                        }
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const confirmDelete = () => {
        removePlant(plant.id);
        setDeleteModalVisible(false);
        router.back();
    };

    const handleDiagnose = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "You've refused to allow this app to access your camera!");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            try {
                setIsDiagnosing(true);
                const diagnosis = await diagnosePlant(plant.id, result.assets[0].uri);
                if (diagnosis.smartTip) {
                    setCustomTip(diagnosis.smartTip);
                }
            } catch (error) {
                Alert.alert("Diagnosis Failed", "Could not analyze the plant. Please try again.");
            } finally {
                setIsDiagnosing(false);
            }
        }
    };

    const handleOpenRename = () => {
        setNewName(plant.name);
        setRenameModalVisible(true);
    };

    const handleRenameSubmit = () => {
        if (newName.trim()) {
            renamePlant(plant.id, newName.trim());
        }
        setRenameModalVisible(false);
    };

    const isThirsty = plant.status === 'thirsty';
    const isOverwatered = plant.status === 'overwatered';

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
        <View style={styles.container}>
            {plant.photos && plant.photos.length > 0 ? (
                <Image source={{ uri: plant.photos[0] }} style={styles.imageHeader} contentFit="cover" />
            ) : (
                <View style={styles.imageHeader} />
            )}

            <SafeAreaView edges={['top']} style={styles.headerSafeLayer}>
                <View style={styles.headerNavRow}>
                    <Pressable style={styles.iconButton} onPress={() => router.back()}>
                        <ChevronLeft color={theme.colors.text} size={28} />
                    </Pressable>
                </View>
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.contentCard}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1, paddingRight: 64 }}>
                            <View style={styles.nameRow}>
                                <Text style={styles.title} numberOfLines={1}>{plant.name}</Text>
                                <Pressable
                                    style={styles.editButton}
                                    onPress={handleOpenRename}
                                    hitSlop={12}
                                >
                                    <Pencil color={theme.colors.textSecondary} size={18} />
                                </Pressable>
                            </View>
                            <Text style={styles.subtitle}>{plant.species}</Text>

                            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                                <StatusIcon color={statusColor} size={16} />
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {statusText}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Floating Action for Photo Overlap */}
                    <View style={styles.floatingActionWrapper}>
                        <Pressable style={styles.floatingUpdateButton} onPress={handleUpdatePhoto}>
                            <Camera color={theme.colors.primary} size={24} />
                        </Pressable>
                    </View>

                    {/* Contextual Smart Tip */}
                    <View style={styles.smartTipContainer}>
                        <View style={styles.smartTipHeader}>
                            <Lightbulb color={theme.colors.primary} size={18} />
                            <Text style={styles.smartTipTitle}>Plantie Tip</Text>
                        </View>
                        <Text style={styles.smartTipText}>
                            {customTip ? customTip : (isThirsty
                                ? `It's been dry lately. Give your ${plant.name} a thorough soaking until water drains from the bottom.`
                                : isOverwatered
                                    ? `Your ${plant.name} is showing signs of overwatering. Let the topsoil dry out completely before watering again, and ensure it has good drainage.`
                                    : `Your ${plant.name} is looking great! Make sure it's getting enough indirect bright light today.`)}
                        </Text>
                    </View>

                    <View style={styles.devActionsContainer}>
                        <Pressable
                            style={styles.diagnoseButton}
                            onPress={handleDiagnose}
                            disabled={isDiagnosing}
                        >
                            {isDiagnosing ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Sparkles color="#FFF" size={20} />
                            )}
                            <Text style={styles.diagnoseButtonText}>
                                {isDiagnosing ? 'Analyzing...' : 'Diagnose with AI'}
                            </Text>
                        </Pressable>
                    </View>

                    <Text style={styles.sectionTitle}>Care Requirements</Text>
                    <View style={styles.requirementsGrid}>
                        <Pressable style={({ pressed }) => [styles.reqCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                            <Sun color="#FFB020" size={24} />
                            <Text style={styles.reqLabel}>Bright Indirect</Text>
                            <Text style={styles.reqSub}>Sunlight</Text>
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.reqCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                            <Droplets color="#2196F3" size={24} />
                            <Text style={styles.reqLabel}>Every {plant.waterFrequencyDays} Days</Text>
                            <Text style={styles.reqSub}>Watering</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.sectionTitle}>Recent History</Text>
                    <View style={styles.historyList}>
                        {plant.logs.length === 0 ? (
                            <Text style={styles.reqSub}>No logs yet.</Text>
                        ) : (
                            plant.logs.map((log, index) => (
                                <PlantHistoryItem
                                    key={log.id}
                                    log={log}
                                    isLast={index === plant.logs.length - 1}
                                    onDelete={(logId) => removeLog(plant.id, logId)}
                                />
                            ))
                        )}
                    </View>

                    <View style={{ height: 24 }} />
                    <Text style={styles.sectionTitle}>Photo Album</Text>
                    <View style={styles.albumGrid}>
                        {plant.photos && plant.photos.length > 0 ? (
                            plant.photos.map((photo, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: photo }}
                                    style={styles.albumImage}
                                    contentFit="cover"
                                />
                            ))
                        ) : (
                            <Text style={styles.reqSub}>No photos yet.</Text>
                        )}
                    </View>

                    <Pressable style={styles.deletePlantButton} onPress={() => setDeleteModalVisible(true)}>
                        <Trash2 color="#FF3B30" size={20} />
                        <Text style={styles.deletePlantText}>Delete Plant</Text>
                    </Pressable>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.actionRow}>
                    <Pressable
                        style={[styles.waterButton, !isThirsty && { backgroundColor: theme.colors.primaryLight }]}
                        onPress={handleWater}
                        disabled={!isThirsty}
                    >
                        <Droplets color={!isThirsty ? theme.colors.primary : "#FFF"} size={20} />
                        <Text style={[styles.waterButtonText, !isThirsty && { color: theme.colors.primary }]}>
                            {isThirsty ? 'Water Now' : 'Recently Watered'}
                        </Text>
                    </Pressable>
                    <Pressable style={styles.secondaryActionBtn} onPress={handleMist}>
                        <CloudRain color={theme.colors.primary} size={24} />
                    </Pressable>
                    <Pressable style={styles.secondaryActionBtn} onPress={handleFertilize}>
                        <Sparkles color={theme.colors.primary} size={24} />
                    </Pressable>
                </View>
            </View>

            {/* Custom Aesthetic Delete Confirmation Modal */}
            <DeletePlantModal
                visible={isDeleteModalVisible}
                plantName={plant.name}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={confirmDelete}
            />

            {/* Custom Aesthetic Rename Modal */}
            <RenamePlantModal
                visible={isRenameModalVisible}
                newName={newName}
                onNameChange={setNewName}
                onClose={() => setRenameModalVisible(false)}
                onSave={handleRenameSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    imageHeader: { height: 350, backgroundColor: theme.colors.primary, position: 'absolute', top: 0, left: 0, right: 0 },
    headerSafeLayer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    headerNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm },
    iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
    navBackButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    uploadButton: { backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    uploadButtonText: { color: theme.colors.text, fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14 },
    scrollContent: { paddingTop: 300 },
    contentCard: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: theme.spacing.lg, minHeight: 600 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.xl },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    editButton: { marginLeft: 8, padding: 4, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.border },
    title: { fontSize: 28, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, flexShrink: 1 },
    subtitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, opacity: 0.8 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.round, gap: 6, alignSelf: 'flex-start' },
    statusText: { color: theme.colors.status.healthy, fontFamily: theme.typography.fontFamily.semiBold, fontSize: 14 },
    sectionTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.md },
    requirementsGrid: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl },
    reqCard: { flex: 1, backgroundColor: theme.colors.primaryLight, padding: 20, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
    reqLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.text, marginTop: 12, marginBottom: 2, textAlign: 'center' },
    reqSub: { fontSize: 12, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, textAlign: 'center' },
    historyList: { paddingLeft: 8 },
    albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    albumImage: { width: '31%', aspectRatio: 1, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.border },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.surface, padding: theme.spacing.lg, paddingBottom: 40, borderTopWidth: 1, borderTopColor: theme.colors.border, shadowColor: '#1B4D3E', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
    actionRow: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
    waterButton: { flex: 1, backgroundColor: '#2D7A5F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: theme.borderRadius.lg, gap: 8 },
    waterButtonText: { color: '#FFF', fontSize: 18, fontFamily: theme.typography.fontFamily.bold },
    secondaryActionBtn: { width: 56, height: 56, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
    floatingActionWrapper: { position: 'absolute', top: -32, right: 24, zIndex: 10 },
    floatingUpdateButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8DEF8', alignItems: 'center', justifyContent: 'center', shadowColor: '#1B4D3E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    smartTipContainer: { backgroundColor: 'rgba(52, 199, 89, 0.1)', padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: 'rgba(52, 199, 89, 0.2)' },
    smartTipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.xs },
    smartTipTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
    smartTipText: { fontSize: 15, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, lineHeight: 22 },
    devActionsContainer: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
    diagnoseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6200EE', paddingVertical: 14, borderRadius: theme.borderRadius.md, gap: 8, shadowColor: '#6200EE', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    diagnoseButtonText: { color: '#FFF', fontSize: 16, fontFamily: theme.typography.fontFamily.bold },
    deletePlantButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: theme.spacing.xl, paddingVertical: theme.spacing.md, backgroundColor: '#FFF0F0', borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: '#FFE0E0' },
    deletePlantText: { color: '#FF3B30', fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold },
});
