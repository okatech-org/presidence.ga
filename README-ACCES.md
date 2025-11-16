# Accès Lovable / Supabase & Pilotage depuis Cursor

## Identifiants Supabase
- Projet: `bpaouvtlexhtschufshd`
- URL: `https://bpaouvtlexhtschufshd.supabase.co`
- Anon Key: déjà placée dans `.env.local`

## Variables d’environnement locales
Créez `.env.local` à la racine (déjà fait) :
```
VITE_SUPABASE_URL=https://bpaouvtlexhtschufshd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...anon key...
VITE_SUPABASE_PROJECT_ID=bpaouvtlexhtschufshd
```

## Commandes utiles
```
npm run open:lovable   # Ouvrir le projet Lovable
npm run open:supabase  # Ouvrir le dashboard Supabase du projet
npm run test:api       # Tester rapidement les endpoints Edge Functions
```

## Endpoints Edge Functions
Base URL : `https://bpaouvtlexhtschufshd.supabase.co`
```
POST /functions/v1/chat-with-iasted
POST /functions/v1/log-analytics
POST /functions/v1/transcribe-audio
GET  /functions/v1/list-voices
POST /functions/v1/initialize-demo-accounts
```

## Synchronisation Lovable ↔ Cursor
- Push Git depuis Cursor → Sync automatique vers Lovable
- Changements Lovable → Push GitHub → Pull dans Cursor


