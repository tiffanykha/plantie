import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../theme';

interface RenamePlantModalProps {
    visible: boolean;
    newName: string;
    onNameChange: (text: string) => void;
    onClose: () => void;
    onSave: () => void;
}

export const RenamePlantModal = React.memo(({ visible, newName, onNameChange, onClose, onSave }: RenamePlantModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.renameModalContent}>
                    <Text style={styles.modalTitle}>Rename Plant</Text>
                    <TextInput
                        style={styles.renameInput}
                        value={newName}
                        onChangeText={onNameChange}
                        placeholder="Enter new plant name"
                        autoFocus
                        selectionColor={theme.colors.primary}
                    />

                    <View style={styles.modalActions}>
                        <Pressable
                            style={[styles.modalButton, styles.modalCancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.modalButton, styles.modalSaveButton]}
                            onPress={onSave}
                        >
                            <Text style={styles.modalSaveText}>Save</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
    renameModalContent: { backgroundColor: theme.colors.surface, width: '100%', borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, ...theme.shadows.lg },
    modalTitle: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.lg },
    renameInput: { width: '100%', backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text, marginBottom: theme.spacing.xl },
    modalActions: { flexDirection: 'row', gap: theme.spacing.md, width: '100%' },
    modalButton: { flex: 1, paddingVertical: 16, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    modalCancelButton: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    modalCancelText: { fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.text },
    modalSaveButton: { backgroundColor: theme.colors.primary },
    modalSaveText: { fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold, color: '#FFF' },
});
