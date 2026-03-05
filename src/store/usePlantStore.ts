import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { api } from '../lib/api';

const PLANTS_CACHE_KEY = 'plantie_plants_cache';

export type PlantStatus = 'healthy' | 'thirsty' | 'critical' | 'overwatered';

export interface PlantLog {
    id: string;
    action: 'watered' | 'misted' | 'fertilized' | 'repotted' | 'other' | 'photo_added';
    note?: string;
    date: string;
}

export interface Plant {
    id: string;
    name: string;
    species: string;
    status: PlantStatus;
    waterFrequencyDays: number;
    lightRequirement?: string;
    lastWatered: string;
    photos: string[];
    logs: PlantLog[];
}

interface PlantStore {
    plants: Plant[];
    isLoading: boolean;
    fetchPlants: (skipCache?: boolean) => Promise<void>;
    addPlant: (plant: Omit<Plant, 'id' | 'logs' | 'lastWatered'>) => Promise<void>;
    waterPlant: (id: string) => Promise<void>;
    logCareAction: (id: string, action: PlantLog['action'], note?: string) => Promise<void>;
    removeLog: (plantId: string, logId: string) => void;
    removePlant: (id: string) => void;
    addPhoto: (id: string, photoUri: string) => Promise<void>;
    renamePlant: (id: string, newName: string) => Promise<void>;
    updatePlantStatus: (id: string, status: PlantStatus) => Promise<void>;
    diagnosePlant: (id: string, photoUri: string) => Promise<any>;
    identifyPlant: (photoUri: string) => Promise<any>;
}

export const usePlantStore = create<PlantStore>((set, get) => ({
    plants: [],
    isLoading: false,

    fetchPlants: async (skipCache = false) => {
        // Load cached plants immediately for instant display (skip when we just wrote fresh data)
        if (!skipCache) {
            try {
                const cached = await AsyncStorage.getItem(PLANTS_CACHE_KEY);
                if (cached) {
                    set({ plants: JSON.parse(cached) });
                }
            } catch {}
        }

        set({ isLoading: true });
        try {
            const dbPlants = await api.fetchPlants();
            const mappedPlants: Plant[] = dbPlants.map((dbp: any) => {
                const waterLogs = (dbp.care_logs || [])
                    .filter((l: any) => l.action_type === 'watered')
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const lastWatered = waterLogs.length > 0
                    ? waterLogs[0].created_at
                    : dbp.created_at;

                return {
                    id: dbp.id,
                    name: dbp.name,
                    species: dbp.species,
                    status: dbp.status as PlantStatus,
                    waterFrequencyDays: dbp.water_frequency_days,
                    lightRequirement: dbp.light_requirement,
                    lastWatered,
                    // Sort newest-first so photos[0] is always the most recent (hero image)
                    photos: (dbp.photos || [])
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((p: any) => p.image_url),
                    // Sort newest-first so the history list and last-watered lookup are correct
                    logs: (dbp.care_logs || [])
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((l: any) => ({
                            id: l.id,
                            action: l.action_type,
                            note: l.note,
                            date: l.created_at
                        }))
                };
            });
            set({ plants: mappedPlants });
            // Persist to cache for next open
            AsyncStorage.setItem(PLANTS_CACHE_KEY, JSON.stringify(mappedPlants)).catch(() => {});
        } catch (error) {
            console.error('Failed to fetch plants:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addPlant: async (plantData) => {
        try {
            // Create the plant first (no photo_url — local URIs can't be saved to DB)
            const newPlant = await api.createPlant({
                name: plantData.name,
                species: plantData.species,
                water_frequency_days: plantData.waterFrequencyDays,
                light_requirement: plantData.lightRequirement,
                status: plantData.status,
            });
            // If a photo was taken, upload it to Supabase Storage via the backend
            if (plantData.photos?.[0]) {
                try {
                    await api.addPlantPhoto(newPlant.id, plantData.photos[0]);
                } catch (photoError) {
                    console.error('Failed to upload initial plant photo', photoError);
                }
            }
            // Re-fetch to get complete mapped db format with photo URLs
            get().fetchPlants();
        } catch (error) {
            console.error('Failed to add plant', error);
        }
    },

    waterPlant: async (id) => {
        await get().logCareAction(id, 'watered');
        // Instantly update UI optimistically
        set((state) => ({
            plants: state.plants.map((plant) => {
                if (plant.id === id) {
                    return {
                        ...plant,
                        status: 'healthy',
                        lastWatered: new Date().toISOString(),
                    };
                }
                return plant;
            })
        }));
        try {
            await api.updatePlant(id, { status: 'healthy' });
        } catch (error) {
            console.error('Failed to update plant status on water', error);
            get().fetchPlants();
        }
    },

    logCareAction: async (id, action, note) => {
        try {
            const log = await api.logCareAction(id, action, note);

            // Optimistic native update
            set((state) => ({
                plants: state.plants.map((plant) => {
                    if (plant.id === id) {
                        const newLog: PlantLog = {
                            id: log.id,
                            action: log.action_type,
                            note: log.note,
                            date: log.created_at,
                        };
                        return {
                            ...plant,
                            logs: [newLog, ...plant.logs],
                        };
                    }
                    return plant;
                })
            }));
        } catch (error) {
            console.error('Failed to log care action', error);
        }
    },

    removePlant: async (id) => {
        // Optimistic native update
        set((state) => ({ plants: state.plants.filter((p) => p.id !== id) }));
        try {
            await api.deletePlant(id);
        } catch (error) {
            console.error('Failed to remove plant from backend', error);
            // Re-fetch to revert on failure
            get().fetchPlants();
        }
    },

    addPhoto: async (id, photoUri) => {
        // Optimistic update with local URI so the photo appears instantly in the UI
        const tempId = Math.random().toString(36).substring(7);
        set((state) => ({
            plants: state.plants.map((plant) => {
                if (plant.id === id) {
                    const newLog: PlantLog = { id: tempId, action: 'photo_added', date: new Date().toISOString() };
                    const currentPhotos = plant.photos || [];
                    const currentLogs = plant.logs || [];
                    return {
                        ...plant,
                        photos: [photoUri, ...currentPhotos],
                        logs: [newLog, ...currentLogs]
                    };
                }
                return plant;
            })
        }));

        try {
            await api.addPlantPhoto(id, photoUri);
            // Skip cache so the stale AsyncStorage snapshot doesn't overwrite the optimistic update
            // before the fresh API data arrives (fixes the iOS "photo flash" bug)
            get().fetchPlants(true);
        } catch (error) {
            console.error('Failed to add photo in backend', error);
            get().fetchPlants(true);
        }
    },

    renamePlant: async (id, newName) => {
        set((state) => ({ plants: state.plants.map((p) => p.id === id ? { ...p, name: newName } : p) }));
        try {
            await api.updatePlant(id, { name: newName });
        } catch (error) {
            console.error('Failed to rename plant', error);
            get().fetchPlants();
        }
    },

    updatePlantStatus: async (id, status) => {
        set((state) => ({ plants: state.plants.map((p) => p.id === id ? { ...p, status } : p) }));
        try {
            await api.updatePlant(id, { status });
        } catch (error) {
            console.error('Failed to update plant status', error);
            get().fetchPlants();
        }
    },

    removeLog: async (plantId, logId) => {
        set((state) => ({
            plants: state.plants.map((p) => p.id === plantId ? { ...p, logs: p.logs.filter((l) => l.id !== logId) } : p)
        }));
        try {
            await api.deleteCareLog(plantId, logId);
        } catch (error) {
            console.error('Failed to delete log', error);
            get().fetchPlants();
        }
    },

    diagnosePlant: async (id, photoUri) => {
        try {
            const result = await api.diagnosePlant(id, photoUri);
            if (result.healthStatus) {
                get().updatePlantStatus(id, result.healthStatus);
            }
            return result;
        } catch (error) {
            console.error('Failed to diagnose plant', error);
            throw error;
        }
    },

    identifyPlant: async (photoUri) => {
        try {
            return await api.identifyPlant(photoUri);
        } catch (error) {
            console.error('Failed to identify plant', error);
            throw error;
        }
    }
}));
