import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    };
}

export const api = {
    fetchPlants: async () => {
        const res = await fetch(`${API_URL}/api/plants`, {
            headers: await getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch plants');
        return res.json();
    },

    createPlant: async (plantData: any) => {
        const res = await fetch(`${API_URL}/api/plants`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(plantData)
        });
        if (!res.ok) throw new Error('Failed to create plant');
        return res.json();
    },

    logCareAction: async (plantId: string, action_type: string, note?: string) => {
        const res = await fetch(`${API_URL}/api/plants/${plantId}/logs`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ action_type, note })
        });
        if (!res.ok) throw new Error('Failed to log care action');
        return res.json();
    },

    deletePlant: async (id: string) => {
        const res = await fetch(`${API_URL}/api/plants/${id}`, {
            method: 'DELETE',
            headers: await getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete plant');
        return res.json();
    },

    updatePlant: async (id: string, updates: any) => {
        const res = await fetch(`${API_URL}/api/plants/${id}`, {
            method: 'PATCH',
            headers: await getAuthHeaders(),
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update plant');
        return res.json();
    },

    addPlantPhoto: async (id: string, photoUri: string) => {
        const { data: { session } } = await supabase.auth.getSession();

        const formData = new FormData();
        formData.append('photo', {
            uri: photoUri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        } as any);

        const res = await fetch(`${API_URL}/api/plants/${id}/photos`, {
            method: 'POST',
            headers: {
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
            },
            body: formData
        });
        if (!res.ok) throw new Error('Failed to add photo');
        return res.json();
    },

    deleteCareLog: async (plantId: string, logId: string) => {
        const res = await fetch(`${API_URL}/api/plants/${plantId}/logs/${logId}`, {
            method: 'DELETE',
            headers: await getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete care log');
        return res.json();
    },

    diagnosePlant: async (plantId: string, photoUri: string) => {
        // We need to send FormData for file upload
        const { data: { session } } = await supabase.auth.getSession();

        const formData = new FormData();

        // In React Native, we pass an object directly to FormData for files
        formData.append('photo', {
            uri: photoUri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        } as any);

        const res = await fetch(`${API_URL}/api/plants/${plantId}/diagnose`, {
            method: 'POST',
            headers: {
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
            },
            body: formData
        });

        if (!res.ok) throw new Error('Failed to diagnose plant');
        return res.json();
    },

    identifyPlant: async (photoUri: string) => {
        const { data: { session } } = await supabase.auth.getSession();

        const formData = new FormData();

        // In React Native, we pass an object directly to FormData for files
        formData.append('photo', {
            uri: photoUri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        } as any);

        const res = await fetch(`${API_URL}/api/plants/identify`, {
            method: 'POST',
            headers: {
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
            },
            body: formData
        });

        if (!res.ok) throw new Error('Failed to identify plant');
        return res.json();
    }
};
