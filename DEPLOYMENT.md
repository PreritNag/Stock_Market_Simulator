# Deployment Guide

## Backend on Render

1. Create a new Web Service in Render.
2. Connect your GitHub repository and choose the `main` branch.
3. Set the service root directory to `backend`.
4. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
5. Add these environment variables in Render:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `ALPHA_VANTAGE_API_KEY`
   - `CLIENT_URL` = `https://<your-vercel-frontend-url>`
   - `NODE_ENV` = `production`

Render will provide the backend URL. Use that URL in Vercel for the frontend.

## Frontend on Vercel

1. Create a new Vercel project and connect the same GitHub repository.
2. Set the project root directory to `frontend`.
3. Use these settings:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add these environment variables in Vercel:
   - `VITE_API_URL` = `https://<your-render-backend-url>`
   - `VITE_GOOGLE_CLIENT_ID`

The frontend now uses `VITE_API_URL` in production. In local development, it still proxies `/api` to `http://localhost:5000`.

## Notes

- `frontend/.env.example` includes the expected Vercel env variables.
- `render.yaml` contains a Render service definition for the backend.
- `frontend/vercel.json` contains Vercel routing for the frontend SPA.
- The backend now uses a stable `.env` path resolution from `backend/server.js`.
