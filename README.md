# MetroBusiness - Επιχειρήσεις κοντά στο Μετρό Θεσσαλονίκης

Μια σύγχρονη πλατφόρμα που συνδέει τις τοπικές επιχειρήσεις της Θεσσαλονίκης με τους επιβάτες του μετρό.

## 🚀 Χαρακτηριστικά

- **Εύρεση επιχειρήσεων** κοντά στις στάσεις μετρό
- **Προσφορές και εκπτώσεις** από τοπικές επιχειρήσεις
- **Διαδραστικός χάρτης** με πλοήγηση
- **Responsive design** για όλες τις συσκευές
- **Admin dashboard** για διαχείριση
- **Business dashboard** για επιχειρήσεις

## 🛠️ Τεχνολογίες

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Maps**: Leaflet, OpenStreetMap
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Deployment**: Netlify, Bolt Hosting

## 📦 Εγκατάσταση

1. **Clone το repository**
   ```bash
   git clone <repository-url>
   cd metrobusiness
   ```

2. **Εγκατάσταση dependencies**
   ```bash
   npm install
   ```

3. **Διαμόρφωση Supabase**
   ```bash
   cp .env.example .env
   ```
   
   Επεξεργαστείτε το `.env` αρχείο και προσθέστε τα Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Εκκίνηση development server**
   ```bash
   npm run dev
   ```

## 🗄️ Supabase Setup

### Βήμα 1: Δημιουργία Supabase Project

1. Πηγαίνετε στο [Supabase Dashboard](https://supabase.com/dashboard)
2. Δημιουργήστε νέο project
3. Περιμένετε να ολοκληρωθεί η εγκατάσταση

### Βήμα 2: Λήψη Credentials

1. Πηγαίνετε στο **Settings > API**
2. Αντιγράψτε το **Project URL**
3. Αντιγράψτε το **anon public key**

### Βήμα 3: Database Schema

Το schema της βάσης δεδομένων δημιουργείται αυτόματα μέσω των migration αρχείων στο φάκελο `supabase/migrations/`.

Κύριοι πίνακες:
- `businesses` - Στοιχεία επιχειρήσεων
- `metro_stations` - Στάσεις μετρό
- `offers` - Προσφορές επιχειρήσεων
- `user_roles` - Ρόλοι χρηστών
- `business_photos` - Φωτογραφίες επιχειρήσεων
- `business_hours` - Ωράρια λειτουργίας
- `app_settings` - Ρυθμίσεις εφαρμογής
- `footer_pages` - Σελίδες footer

## 🚀 Deployment

### Netlify Deployment

1. **Συνδέστε το repository στο Netlify**
2. **Ρυθμίστε τα Environment Variables**:
   - `VITE_SUPABASE_URL`: Το URL του Supabase project
   - `VITE_SUPABASE_ANON_KEY`: Το anon public key
3. **Deploy**

### Bolt Hosting Deployment

Το project είναι ήδη διαμορφωμένο για Bolt Hosting και θα κάνει deploy αυτόματα.

## 🔧 Demo Mode

Αν δεν έχετε διαμορφώσει το Supabase, η εφαρμογή θα λειτουργήσει σε **demo mode** με:
- Δεδομένα δείγματος για επιχειρήσεις και στάσεις μετρό
- Απενεργοποιημένη λειτουργικότητα login/register
- Σαφή μηνύματα για τους χρήστες

## 👥 Ρόλοι Χρηστών

- **Admin**: Πλήρη πρόσβαση σε όλες τις λειτουργίες
- **Business**: Διαχείριση επιχειρήσεων και προσφορών

## 📱 Mobile Support

Η εφαρμογή είναι πλήρως responsive με:
- Mobile-first design
- Touch-friendly interface
- Bottom navigation για mobile
- Optimized για όλες τις συσκευές

## 🤝 Contributing

1. Fork το repository
2. Δημιουργήστε feature branch
3. Commit τις αλλαγές σας
4. Push στο branch
5. Δημιουργήστε Pull Request

## 📄 License

MIT License - δείτε το LICENSE αρχείο για λεπτομέρειες.

## 📞 Support

Για υποστήριξη, επικοινωνήστε στο: info@buybymetro.gr