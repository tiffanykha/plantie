# Plantie – Project Notes for Claude

## Architecture
- **Frontend**: React Native / Expo (TypeScript)
- **Backend API**: Deployed on Render at `https://plantie-backend-ahwu.onrender.com`
- **Database + Auth + Storage**: Supabase (`plant-photos` bucket for images)

## Dev Server Setup
- **Only start the frontend** (`Plantie Web (Frontend)` in launch.json) — it runs the Expo Metro bundler on port 8083
- **Do NOT start a local backend**. The app's `EXPO_PUBLIC_API_URL` already points to the Render backend, which handles all API calls from both web and Expo Go
- The local `backend/` folder exists for reference and deployment, but should not be run locally during development

## Expo Go (Mobile)
- Run `npx expo start` in the project root for the interactive QR code
- Or enter `exp://192.168.0.240:8085` manually in Expo Go (same Wi-Fi required)
- The Render backend handles all API requests, so Expo Go works from anywhere

## Node / npm Location
- Node: `C:/Users/TK/.local/opt/node-v20.11.1-win-x64/node.exe`
- npm: `C:/Users/TK/.local/opt/node-v20.11.1-win-x64/npm.cmd`
- Use `node.exe` directly in launch.json (`.cmd` files cause spawn errors with preview_start)

## Photos
- Photos are uploaded to Supabase Storage (`plant-photos` bucket) via the backend and stored as public `https://` URLs
- The camera button on the plant detail screen offers both "Take Photo" and "Choose from Library"
- `addPlantPhoto` sends FormData to `POST /api/plants/:id/photos` which handles the Supabase Storage upload

## Render Deployment
- Config: `render.yaml` in project root
- Required env vars on Render dashboard: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`
