import { Leaf } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

export default function LoginScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    async function handleAuth() {
        if (!email || !password || (isSignUp && !name)) {
            if (Platform.OS === 'web') window.alert('Please fill out all fields');
            else Alert.alert('Error', 'Please fill out all fields');
            return;
        }

        setLoading(true);
        try {
            const { error, data } = isSignUp
                ? await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            displayName: name
                        }
                    }
                })
                : await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                if (Platform.OS === 'web') window.alert(error.message);
                else Alert.alert(isSignUp ? 'Sign Up Error' : 'Sign In Error', error.message);
            } else if (isSignUp) {
                if (Platform.OS === 'web') window.alert('Success: Check your email for the confirmation link');
                else Alert.alert('Success', 'Check your email for the confirmation link');
            }
        } catch (e: any) {
            console.error("Auth Exception:", e);
            if (Platform.OS === 'web') window.alert(e.message || 'An unexpected error occurred');
            else Alert.alert('Exception', e.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Leaf color={theme.colors.primary} size={48} />
                    </View>
                    <Text style={styles.title}>Plantie</Text>
                    <Text style={styles.subtitle}>Your digital plant journal</Text>
                </View>

                <View style={styles.form}>
                    {isSignUp && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Charlie"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!loading}
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="hello@plantie.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                        )}
                    </Pressable>

                    <Pressable
                        style={styles.switchMode}
                        onPress={() => setIsSignUp(!isSignUp)}
                        disabled={loading}
                    >
                        <Text style={styles.switchModeText}>
                            {isSignUp ? 'Already have an account? Sign In' : 'New to Plantie? Create Account'}
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    inner: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl },
    header: { alignItems: 'center', marginBottom: theme.spacing.xxl * 1.5 },
    iconContainer: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: theme.spacing.lg,
        shadowColor: '#1B4D3E', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
        elevation: 3
    },
    title: { fontSize: 36, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, marginBottom: 8 },
    subtitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary },
    form: { backgroundColor: '#FFF', padding: theme.spacing.xl, borderRadius: theme.borderRadius.xl, ...theme.shadows.md },
    inputContainer: { marginBottom: theme.spacing.lg },
    label: { fontSize: 14, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.text, marginBottom: 8 },
    input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: 16, fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
    button: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: theme.borderRadius.lg, alignItems: 'center', marginTop: theme.spacing.md },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#FFF', fontSize: 16, fontFamily: theme.typography.fontFamily.bold },
    switchMode: { marginTop: theme.spacing.xl, alignItems: 'center' },
    switchModeText: { color: theme.colors.primary, fontSize: 14, fontFamily: theme.typography.fontFamily.semiBold }
});
