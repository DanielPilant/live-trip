# Live Trip

A real-time crowd monitoring application built with Next.js, Supabase, and Leaflet.

## Features

- **Interactive Map**: Full-screen map interface using Leaflet.
- **Real-time Data**: View live crowd levels at various sites.
- **Google Authentication**: Secure sign-in using Google OAuth via Supabase.
- **Modern UI**: Minimalist, Google Maps-inspired design.

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd live-trip
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Environment Variables

This project uses Supabase for backend services. You need to configure your environment variables.

1.  Copy the example environment file:

    ```bash
    cp .env.example .env.local
    ```

    _(On Windows PowerShell, use `Copy-Item .env.example .env.local`)_

2.  Open `.env.local` and fill in your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
    ```

    You can find these keys in your [Supabase Dashboard](https://supabase.com/dashboard) under **Settings > API**.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

Run the SQL commands in `supabase/schema.sql` in your Supabase SQL Editor to set up the necessary tables and security policies.
