import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut, Save } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/useAuthStore';
import { theme } from '../src/theme';

export default function SettingsScreen() {
    const { user, updateProfile, signOut } = useAuthStore();
    const [name, setName] = useState(user?.user_metadata?.displayName || '');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        if (!name.trim()) {
            if (Platform.OS === 'web') window.alert("Name cannot be empty");
            else Alert.alert("Error", "Name cannot be empty");
            return;
        }

        setLoading(true);
        try {
            await updateProfile(name.trim());
            if (Platform.OS === 'web') window.alert("Profile updated successfully");
            else Alert.alert("Success", "Profile updated successfully");
            router.back();
        } catch (error: any) {
            if (Platform.OS === 'web') window.alert(error.message || "Failed to update profile");
            else Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            // Router will automatically redirect to login because of the listener in _layout.tsx
        } catch (error: any) {
            if (Platform.OS === 'web') window.alert(error.message || "Failed to sign out");
            else Alert.alert("Error", error.message || "Failed to sign out");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ChevronLeft color={theme.colors.text} size={28} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your Name"
                            editable={!loading}
                            autoCapitalize="words"
                        />
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Save color="#FFF" size={20} />
                                <Text style={styles.buttonText}>Save Changes</Text>
                            </>
                        )}
                    </Pressable>
                </View>

                <View style={styles.signOutContainer}>
                    <Pressable
                        style={styles.signOutButton}
                        onPress={handleSignOut}
                        disabled={loading}
                    >
                        <LogOut color="#FF3B30" size={20} />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </Pressable>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    inner: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.xl },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...theme.shadows.sm },
    headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
    form: { paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.lg },
    inputContainer: { marginBottom: theme.spacing.lg },
    label: { fontSize: 14, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.text, marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: 16, fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
    button: { flexDirection: 'row', backgroundColor: theme.colors.primary, padding: 18, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: theme.spacing.md },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#FFF', fontSize: 16, fontFamily: theme.typography.fontFamily.bold },
    signOutContainer: { paddingHorizontal: theme.spacing.xl, marginTop: theme.spacing.xxl * 2 },
    signOutButton: { flexDirection: 'row', backgroundColor: '#FFF0F0', padding: 18, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#FFE0E0' },
    signOutText: { color: '#FF3B30', fontSize: 16, fontFamily: theme.typography.fontFamily.bold },
});
