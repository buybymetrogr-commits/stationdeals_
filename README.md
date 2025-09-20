# MetroBusiness - Επιχειρήσεις κοντά στο Μετρό Θεσσαλονίκης

Μια σύγχρονη web εφαρμογή που συνδέει τις τοπικές επιχειρήσεις της Θεσσαλονίκης με τους επιβάτες του μετρό.

## Χαρακτηριστικά

- 🚇 **Εύρεση επιχειρήσεων** κοντά στις στάσεις μετρό
- 🎯 **Station Deals** - Προσφορές σε ακτίνα 200μ από στάσεις
- 🗺️ **Διαδραστικός χάρτης** με OpenStreetMap
- 📱 **Responsive design** για όλες τις συσκευές
- 🔐 **Σύστημα εγγραφής** για επιχειρήσεις
- 📊 **Dashboard διαχείρισης** για επιχειρήσεις και διαχειριστές

## Τεχνολογίες

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Maps:** Leaflet με OpenStreetMap
- **Deployment:** Netlify/Bolt Hosting

## Εγκατάσταση

1. **Clone το repository:**
   ```bash
   git clone <repository-url>
   cd metrobusiness
   ```

2. **Εγκατάσταση dependencies:**
   ```bash
   npm install
   ```

3. **Διαμόρφωση Supabase:**
   - Αντιγράψτε το `.env.example` σε `.env`
   - Συμπληρώστε τα Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Εκκίνηση development server:**
   ```bash
   npm run dev
   ```

## Demo Mode

Η εφαρμογή λειτουργεί σε **demo mode** όταν δεν είναι διαμορφωμένο το Supabase:
- Χρησιμοποιεί δεδομένα δείγματος
- Η σύνδεση/εγγραφή δεν είναι διαθέσιμη
- Εμφανίζεται ειδοποίηση demo mode

## Supabase Setup

Για πλήρη λειτουργικότητα, χρειάζεστε:

1. **Supabase Project** με τις απαραίτητες tables
2. **Environment Variables** στο deployment platform
3. **Edge Functions** για διαχείριση χρηστών (προαιρετικό)

### Environment Variables για Deployment

Στο Netlify/Vercel/άλλο platform, προσθέστε:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Δομή Project

```
src/
├── components/          # React components
├── pages/              # Page components
├── data/               # Fallback data
├── lib/                # Supabase client
├── types/              # TypeScript types
├── utils/              # Utility functions
└── main.tsx           # Entry point

supabase/
├── functions/          # Edge Functions
└── migrations/         # Database migrations
```

## Deployment

### Netlify
1. Connect repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Bolt Hosting
1. Use the deploy button in Bolt
2. Environment variables are handled automatically

## Συνεισφορά

1. Fork το repository
2. Δημιουργήστε feature branch
3. Commit τις αλλαγές σας
4. Push στο branch
5. Ανοίξτε Pull Request

## Άδεια

MIT License - δείτε το LICENSE file για λεπτομέρειες.