# FitTrack — Mobile-First Fitness Tracking Progressive Web App (PWA)

FitTrack is a production-minded, mobile-first fitness tracking Progressive Web App (PWA) built for iPhone and Android, with full desktop responsiveness. Multiple users can create private accounts, configure custom fitness targets, and track their workouts, daily macronutrients, water intake, daily steps, and body weight progress.

---

## ⚡ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (dark charcoal theme + high-energy lime accent `#bbf43d`)
- **Navigation & Routing**: React Router v7 (`react-router-dom`)
- **Backend & Auth**: Supabase Authentication + PostgreSQL + Row Level Security (RLS)
- **Private Storage**: Supabase Storage (`user-media` bucket) for avatars and progress check-in photos
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Visualizations**: Recharts for weight progress curves and 7-day step history
- **PWA Capabilities**: `vite-plugin-pwa` with web manifest, offline asset caching, service worker auto-update, and iOS standalone full-screen support

---

## 📱 Mobile-First Design System

- **Background**: Dark charcoal (`#090a0f`, `#10121a`, `#151822`)
- **Primary Accent**: Energetic lime green (`#bbf43d`, `#ccff00`)
- **Secondary Accents**: Sky blue (hydration/cardio), amber (calories/burn), purple (milestones)
- **Navigation**: Persistent 5-tab bottom navigation with active indicators:
  1. **Home** (`/app/dashboard`)
  2. **Calendar** (`/app/calendar`)
  3. **Workout** (`/app/workouts`) — Elevated center action button
  4. **Nutrition** (`/app/nutrition`)
  5. **Profile** (`/app/profile`)
- **iOS Safe Areas**: Native bottom home bar support via `env(safe-area-inset-bottom)`
- **Quick Shortcuts**: One-tap access to **Activity** (`/app/activity`) and **Settings** (`/app/settings`) from the top header

---

## 🚀 Routes & Architecture

```
/signup           -> Multi-user registration with RLS isolation
/login            -> Session authentication + demo credentials quick fill
/onboarding       -> 3-step wizard (Goal, Body Metrics, Daily Calorie/Macro/Step Targets)
/app/dashboard    -> Core daily rings, stat cards, today's workout, nutrition & water tracker
/app/calendar     -> Interactive monthly & weekly calendar with workout markers & day drilldown
/app/workouts     -> Workout journal, active set logger (load, reps, RPE), exercise library
/app/nutrition    -> Daily nutrition diary (Breakfast, Lunch, Dinner, Snacks), macro rings, water
/app/activity     -> Dedicated steps tracker, distance (km/mi), active burn, 7-day volume chart
/app/profile      -> Body weight progress curve, target delta, check-in photos, avatar upload
/app/settings     -> Edit goals, target calories/macros, toggle Metric (kg) vs Imperial (lbs), PWA install
```

---

## 🛠️ Supabase Setup Instructions

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings > API**, copy:
   - **Project URL**
   - **anon public API key**

### 2. Run Database Schema & RLS Policies
Navigate to the **SQL Editor** in your Supabase Dashboard, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.

This script sets up:
- `public.profiles` with `handle_new_user()` auto-creation trigger on signup.
- `public.workouts`, `public.workout_exercises`, and `public.exercise_sets` for workouts.
- `public.nutrition_logs` and `public.water_logs` for meals and hydration.
- `public.activity_logs` for daily steps and distance.
- `public.weight_logs` for body scale check-ins and photos.
- **Row Level Security (RLS)** enabled on all tables (`auth.uid() = user_id`).
- `user-media` Supabase Storage bucket with folder-level RLS policies (`(storage.foldername(name))[1] = auth.uid()::text`).

### 3. Configure Local Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):

```bash
cp .env.example .env
```

Set your keys:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Note on Sandbox Mode**: If you launch the app without Supabase credentials configured, FitTrack automatically operates in **Local Sandbox Mode**. All features, workouts, foods, and weights work immediately and persist in local browser storage without errors, and display a helpful top banner to guide Supabase setup.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Type-check TypeScript
npx tsc --noEmit

# 4. Lint codebase
npm run lint

# 5. Production build
npm run build
```

---

## 📲 Installing as a PWA

### On iPhone (iOS Safari):
1. Open FitTrack in Safari.
2. Tap the **Share** button (box with an arrow pointing up) at the bottom.
3. Scroll down and tap **Add to Home Screen**.
4. FitTrack will launch in full-screen standalone mode like a native app.

### On Android (Chrome):
1. Open FitTrack in Chrome.
2. Tap the **Install App** button in the Settings page or the browser prompt.
3. FitTrack will be installed to your app drawer and home screen.

---

## 🌐 Production Deployment

### Vercel
1. Push your repository to GitHub.
2. Import the repository into [vercel.com](https://vercel.com).
3. In Project Settings, add the Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy!

### Netlify
1. Connect repository in Netlify.
2. Add build command: `npm run build` and publish directory: `dist`.
3. Add a `_redirects` rule if needed: `/* /index.html 200`.
4. Add environment variables in Netlify site settings.
