import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera, Check, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePlantStore } from '../src/store/usePlantStore';
import { theme } from '../src/theme';

type Step = 'photo' | 'name' | 'analyzing' | 'success';

export default function AddPlantScreen() {
    const [step, setStep] = useState<Step>('photo');
    const [name, setName] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const router = useRouter();
    const addPlant = usePlantStore((state) => state.addPlant);
    const identifyPlant = usePlantStore((state) => state.identifyPlant);
    const [identifiedSpecies, setIdentifiedSpecies] = useState('');

    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    const handleCapturePhoto = async () => {
        if (!permission?.granted) {
            Alert.alert('Permission required', 'We need access to your camera to identify the plant.');
            return;
        }

        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                });
                if (photo) {
                    setPhotoUri(photo.uri);
                    setStep('name');
                }
            } catch (error) {
                console.error("Failed to take picture:", error);
                Alert.alert('Error', 'Failed to capture photo. Please try again.');
            }
        }
    };

    useEffect(() => {
        if (step === 'analyzing' && photoUri) {
            let isMounted = true;

            const analyzeAndSave = async () => {
                try {
                    // Send photo to Gemini via backend
                    const analysis = await identifyPlant(photoUri);

                    if (!isMounted) return;

                    setIdentifiedSpecies(analysis.species);

                    // Save the plant to the database with all the AI insights
                    await addPlant({
                        name: name || 'My New Plant',
                        species: analysis.species,
                        status: analysis.healthStatus || 'healthy',
                        waterFrequencyDays: analysis.waterFrequencyDays || 7,
                        lightRequirement: analysis.lightRequirement || 'Indirect bright light',
                        photos: [photoUri],
                    });

                    setStep('success');
                } catch (error) {
                    console.error("Analysis failed:", error);
                    if (isMounted) {
                        Alert.alert("Analysis Failed", "We couldn't identify the plant. Please try again.");
                        setStep('name'); // go back so they can retry
                    }
                }
            };

            analyzeAndSave();

            return () => { isMounted = false; };
        }
    }, [step, photoUri]);

    const handleClose = () => router.back();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Add New Plant</Text>
                <Pressable onPress={handleClose} style={styles.closeButton}>
                    <X color={theme.colors.text} size={24} />
                </Pressable>
            </View>

            <View style={styles.content}>
                {step === 'photo' && (
                    <View style={styles.stepContainer}>
                        {!permission ? (
                            <View style={styles.cameraPlaceholder}><ActivityIndicator color={theme.colors.primary} /></View>
                        ) : !permission.granted ? (
                            <View style={styles.cameraPlaceholder}>
                                <Text style={styles.cameraText}>We need your permission to show the camera</Text>
                                <Pressable style={[styles.primaryButton, { marginTop: 16 }]} onPress={requestPermission}>
                                    <Text style={styles.primaryButtonText}>Grant Permission</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.cameraContainer}>
                                <CameraView
                                    style={styles.camera}
                                    facing="back"
                                    ref={cameraRef}
                                />
                            </View>
                        )}
                        <Pressable
                            style={({ pressed }) => [styles.primaryButton, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                            onPress={handleCapturePhoto}
                            disabled={!permission?.granted}
                        >
                            <Camera color="#FFF" size={20} />
                            <Text style={styles.primaryButtonText}>Capture Photo</Text>
                        </Pressable>
                    </View>
                )}

                {step === 'name' && (
                    <View style={styles.stepContainer}>
                        <View style={styles.imagePreviewContainer}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.imagePreview} />
                            ) : null}
                            <Pressable style={styles.retakeButton} onPress={() => setStep('photo')}>
                                <Camera color={theme.colors.textSecondary} size={20} />
                                <Text style={styles.retakeButtonText}>Retake Photo</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.label}>Give your plant a nickname</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Swiss Cheese"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                            placeholderTextColor={theme.colors.textSecondary}
                        />
                        <Pressable
                            style={({ pressed }) => [styles.primaryButton, !name && { opacity: 0.5 }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                            onPress={() => setStep('analyzing')}
                            disabled={!name}
                        >
                            <Text style={styles.primaryButtonText}>AI Plant Identification</Text>
                        </Pressable>
                    </View>
                )}

                {step === 'analyzing' && (
                    <View style={styles.centerContainer}>
                        <Sparkles color={theme.colors.primary} size={48} />
                        <Text style={styles.analyzingTitle}>Gemini is analyzing...</Text>
                        <Text style={styles.analyzingSub}>Identifying plant species and generating care instructions.</Text>
                        <ActivityIndicator style={{ marginTop: 24 }} size="large" color={theme.colors.primary} />
                    </View>
                )}

                {step === 'success' && (
                    <View style={styles.centerContainer}>
                        <View style={styles.successCircle}>
                            <Check color="#FFF" size={32} />
                        </View>
                        <Text style={styles.analyzingTitle}>Identified!</Text>
                        <Text style={styles.analyzingSub}>It's a {identifiedSpecies}. It has been added to your collection.</Text>
                        <Pressable style={({ pressed }) => [styles.primaryButton, { width: '100%', marginTop: 32 }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]} onPress={handleClose}>
                            <Text style={styles.primaryButtonText}>Back to Home</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Preserving same styles
    container: { flex: 1, backgroundColor: theme.colors.surface },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
    closeButton: { position: 'absolute', right: theme.spacing.lg, padding: 4 },
    content: { flex: 1, padding: theme.spacing.lg },
    stepContainer: { flex: 1 },
    centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cameraPlaceholder: { flex: 1, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl, borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed' },
    cameraContainer: { flex: 1, borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginBottom: theme.spacing.xl },
    camera: { flex: 1 },
    cameraText: { marginTop: theme.spacing.md, fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
    imagePreviewContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.xl, backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
    imagePreview: { width: 80, height: 80, borderRadius: theme.borderRadius.md },
    retakeButton: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    retakeButtonText: { color: theme.colors.textSecondary, fontSize: 14, fontFamily: theme.typography.fontFamily.semiBold },
    label: { fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.text, marginBottom: theme.spacing.md },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 16, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text, backgroundColor: theme.colors.background, marginBottom: theme.spacing.xl },
    primaryButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    primaryButtonText: { color: '#FFF', fontSize: 16, fontFamily: theme.typography.fontFamily.bold },
    analyzingTitle: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
    analyzingSub: { fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
    successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.status.healthy, alignItems: 'center', justifyContent: 'center' },
});
