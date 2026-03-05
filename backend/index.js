import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import { analyzePlantImage } from './utils/gemini.js';
import { supabase } from './utils/supabase.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure Multer for memory storage (we'll pass buffers to Gemini and upload to Supabase Storage)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Middleware to verify Supabase JWT token from requests
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    // Verify token with Supabase and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Plantie API is running' });
});

/**
 * PHASE 13 & 15: Identify Plant & Assess Health from Photo
 * Uploads photo, sends to Gemini Vision, returns species, water frequency, light, and health status + tip.
 */
app.post('/api/plants/identify', requireAuth, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo provided' });
        }

        // 1. Analyze image with Gemini
        const analysisResult = await analyzePlantImage(req.file.buffer, req.file.mimetype);

        // Return analysis result to the frontend
        res.json(analysisResult);

        // Note: The frontend will take this result, display it to the user, and if they confirm,
        // it will hit 'POST /api/plants' to actually save the new plant and photo URL to Supabase.
    } catch (error) {
        console.error('Error in /api/plants/identify:', error);
        res.status(500).json({ error: 'Failed to analyze plant photo' });
    }
});

/**
 * Fetch all plants for the authenticated user
 */
app.get('/api/plants', requireAuth, async (req, res) => {
    try {
        // Because we use Service Role in backend, RLS is bypassed by default. 
        // We MUST explicitly filter by user_id to respect tenant isolation in the backend logic.
        const { data, error } = await supabase
            .from('plants')
            .select('*, photos(image_url), care_logs(*)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching plants:', error);
        res.status(500).json({ error: 'Failed to fetch plants' });
    }
});

/**
 * Create a new plant
 */
app.post('/api/plants', requireAuth, async (req, res) => {
    try {
        const { name, species, water_frequency_days, light_requirement, status, photo_url } = req.body;

        // 1. Insert Plant
        const { data: plant, error: plantError } = await supabase
            .from('plants')
            .insert({
                user_id: req.user.id,
                name,
                species,
                water_frequency_days,
                light_requirement,
                status: status || 'healthy'
            })
            .select()
            .single();

        if (plantError) throw plantError;

        // 2. Insert initial photo if provided
        if (photo_url) {
            await supabase.from('photos').insert({
                plant_id: plant.id,
                image_url: photo_url
            });
        }

        res.status(201).json(plant);
    } catch (error) {
        console.error('Error creating plant:', error);
        res.status(500).json({ error: 'Failed to create plant' });
    }
});

/**
 * Log a care action
 */
app.post('/api/plants/:id/logs', requireAuth, async (req, res) => {
    try {
        const { action_type, note } = req.body;
        const { id: plant_id } = req.params;

        // Verify plant ownership
        const { data: plant, error: verifyError } = await supabase
            .from('plants')
            .select('id')
            .eq('id', plant_id)
            .eq('user_id', req.user.id)
            .single();

        if (verifyError || !plant) {
            return res.status(403).json({ error: 'Not authorized or plant not found' });
        }

        const { data: log, error: logError } = await supabase
            .from('care_logs')
            .insert({
                plant_id,
                action_type,
                note
            })
            .select()
            .single();

        if (logError) throw logError;
        res.status(201).json(log);
    } catch (error) {
        console.error('Error logging care action:', error);
        res.status(500).json({ error: 'Failed to log care action' });
    }
});

/**
 * Delete a plant
 */
app.delete('/api/plants/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Verify ownership
        const { data: plant, error: verifyError } = await supabase
            .from('plants')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (verifyError || !plant) {
            return res.status(403).json({ error: 'Not authorized or plant not found' });
        }

        const { error } = await supabase
            .from('plants')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting plant:', error);
        res.status(500).json({ error: 'Failed to delete plant' });
    }
});

/**
 * Update a plant
 */
app.patch('/api/plants/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verify ownership
        const { data: plant, error: verifyError } = await supabase
            .from('plants')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (verifyError || !plant) {
            return res.status(403).json({ error: 'Not authorized or plant not found' });
        }

        const { data, error } = await supabase
            .from('plants')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating plant:', error);
        res.status(500).json({ error: 'Failed to update plant' });
    }
});

/**
 * Add a photo to a plant
 */
app.post('/api/plants/:id/photos', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { photo_url } = req.body;

        // Verify ownership
        const { data: plant, error: verifyError } = await supabase
            .from('plants')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (verifyError || !plant) {
            return res.status(403).json({ error: 'Not authorized or plant not found' });
        }

        const { data, error } = await supabase
            .from('photos')
            .insert({ plant_id: id, image_url: photo_url })
            .select()
            .single();

        if (error) throw error;

        // Phase 15 Addendum: Log this action automatically to history
        await supabase
            .from('care_logs')
            .insert({
                plant_id: id,
                action_type: 'photo_added',
                note: 'New Photo Added'
            });

        res.json(data);
    } catch (error) {
        console.error('Error adding photo:', error);
        res.status(500).json({ error: 'Failed to add photo' });
    }
});

/**
 * Delete a care log
 */
app.delete('/api/plants/:id/logs/:logId', requireAuth, async (req, res) => {
    try {
        const { id, logId } = req.params;

        // Verify ownership
        const { data: plant, error: verifyError } = await supabase
            .from('plants')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (verifyError || !plant) {
            return res.status(403).json({ error: 'Not authorized or plant not found' });
        }

        const { error } = await supabase
            .from('care_logs')
            .delete()
            .eq('id', logId)
            .eq('plant_id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ error: 'Failed to delete log' });
    }
});

/**
 * Diagnose an existing plant from a photo
 */
app.post('/api/plants/:id/diagnose', requireAuth, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo provided' });
        }

        const { id } = req.params;

        // Verify ownership
        const { data: plant, error: verifyError } = await supabase
            .from('plants')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (verifyError || !plant) {
            return res.status(403).json({ error: 'Not authorized or plant not found' });
        }

        // Analyze image with Gemini
        const analysisResult = await analyzePlantImage(req.file.buffer, req.file.mimetype);

        res.json(analysisResult);
    } catch (error) {
        console.error('Error in /api/plants/:id/diagnose:', error);
        res.status(500).json({ error: 'Failed to diagnose plant' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`🌿 Plantie Backend running on http://localhost:${port}`);
});
