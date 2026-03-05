import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

interface DeletePlantModalProps {
    visible: boolean;
    plantName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeletePlantModal = React.memo(({ visible, plantName, onClose, onConfirm }: DeletePlantModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalIconContainer}>
                        <Trash2 color="#FF3B30" size={32} />
                    </View>
                    <Text style={styles.modalTitle}>Say goodbye?</Text>
                    <Text style={styles.modalSubtitle}>
                        Are you sure you want to delete <Text style={{ fontFamily: theme.typography.fontFamily.bold }}>{plantName}</Text>? This action cannot be undone.
                    </Text>

                    <View style={styles.modalActions}>
                        <Pressable
                            style={[styles.modalButton, styles.modalCancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.modalButton, styles.modalDeleteConfirmButton]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.modalDeleteConfirmText}>Delete</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
    modalContent: { backgroundColor: theme.colors.surface, width: '100%', borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, alignItems: 'center', ...theme.shadows.lg },
    modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
    modalTitle: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
    modalSubtitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xl, lineHeight: 24 },
    modalActions: { flexDirection: 'row', gap: theme.spacing.md, width: '100%' },
    modalButton: { flex: 1, paddingVertical: 16, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    modalCancelButton: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    modalCancelText: { fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.text },
    modalDeleteConfirmButton: { backgroundColor: '#FF3B30' },
    modalDeleteConfirmText: { fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold, color: '#FFF' },
});
