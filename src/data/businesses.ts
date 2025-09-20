import { Business } from '../types';

export const businesses: Business[] = [
  {
    id: '1',
    name: 'Φαρμακείο Παπαδόπουλος',
    description: 'Πλήρες φαρμακείο με ευρεία γκάμα προϊόντων υγείας και ομορφιάς',
    categoryId: 'health',
    tier: 'next-door',
    address: 'Τσιμισκή 126, Θεσσαλονίκη 54621',
    location: {
      lat: 40.6327,
      lng: 22.9460
    },
    photos: [
      'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
      'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg',
      'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg'
    ],
    hours: [
      { day: 'Δευτέρα', open: '08:00', close: '21:00' },
      { day: 'Τρίτη', open: '08:00', close: '21:00' },
      { day: 'Τετάρτη', open: '08:00', close: '21:00' },
      { day: 'Πέμπτη', open: '08:00', close: '21:00' },
      { day: 'Παρασκευή', open: '08:00', close: '21:00' },
      { day: 'Σάββατο', open: '08:00', close: '14:00' },
      { day: 'Κυριακή', closed: true, open: '', close: '' }
    ],
    phone: '2310242721',
    website: 'https://pharmacy-example.gr',
    active: true,
    offers: [
      {
        id: 'offer-1',
        title: 'Έκπτωση 15% σε προϊόντα ομορφιάς',
        description: 'Έκπτωση 15% σε όλα τα προϊόντα ομορφιάς και περιποίησης',
        discount_text: '15%',
        valid_from: '2025-01-01T00:00:00Z',
        valid_until: '2025-02-28T23:59:59Z',
        image_url: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
        is_active: true
      }
    ]
  },
  {
    id: '2',
    name: 'Φαρμακείο Αγίας Σοφίας',
    description: 'Σύγχρονο φαρμακείο με εξειδικευμένο προσωπικό',
    categoryId: 'health',
    tier: 'classics',
    address: 'Αγίας Σοφίας 40, Θεσσαλονίκη 54622',
    location: {
      lat: 40.6330,
      lng: 22.9445
    },
    photos: [
      'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg',
      'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
      'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg'
    ],
    hours: [
      { day: 'Δευτέρα', open: '08:00', close: '21:00' },
      { day: 'Τρίτη', open: '08:00', close: '21:00' },
      { day: 'Τετάρτη', open: '08:00', close: '21:00' },
      { day: 'Πέμπτη', open: '08:00', close: '21:00' },
      { day: 'Παρασκευή', open: '08:00', close: '21:00' },
      { day: 'Σάββατο', open: '08:00', close: '14:00' },
      { day: 'Κυριακή', closed: true, open: '', close: '' }
    ],
    phone: '2310242000',
    website: 'https://agiasophia-pharmacy.gr',
    active: true,
    offers: []
  },
  {
    id: '3',
    name: 'Starbucks Βενιζέλου',
    description: 'Αγαπημένος καφές και pastries στην καρδιά της πόλης',
    categoryId: 'cafe',
    tier: 'unicorns',
    address: 'Βενιζέλου 15, Θεσσαλονίκη 54624',
    location: {
      lat: 40.6360,
      lng: 22.9390
    },
    photos: [
      'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
      'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg'
    ],
    hours: [
      { day: 'Δευτέρα', open: '07:00', close: '22:00' },
      { day: 'Τρίτη', open: '07:00', close: '22:00' },
      { day: 'Τετάρτη', open: '07:00', close: '22:00' },
      { day: 'Πέμπτη', open: '07:00', close: '22:00' },
      { day: 'Παρασκευή', open: '07:00', close: '23:00' },
      { day: 'Σάββατο', open: '08:00', close: '23:00' },
      { day: 'Κυριακή', open: '08:00', close: '22:00' }
    ],
    phone: '2310123456',
    website: 'https://starbucks.gr',
    active: true,
    offers: [
      {
        id: 'offer-2',
        title: 'Δωρεάν pastry με κάθε καφέ',
        description: 'Με κάθε αγορά καφέ, πάρτε ένα pastry δωρεάν',
        discount_text: 'Δωρεάν pastry',
        valid_from: '2025-01-01T00:00:00Z',
        valid_until: '2025-01-31T23:59:59Z',
        image_url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
        is_active: true
      }
    ]
  },
  {
    id: '4',
    name: 'McDonald\'s Συντριβάνι',
    description: 'Γρήγορο φαγητό και αγαπημένα menu για όλη την οικογένεια',
    categoryId: 'restaurant',
    tier: 'unicorns',
    address: 'Πλατεία Συντριβανίου 5, Θεσσαλονίκη 54625',
    location: {
      lat: 40.6295,
      lng: 22.9530
    },
    photos: [
      'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
    ],
    hours: [
      { day: 'Δευτέρα', open: '07:00', close: '24:00' },
      { day: 'Τρίτη', open: '07:00', close: '24:00' },
      { day: 'Τετάρτη', open: '07:00', close: '24:00' },
      { day: 'Πέμπτη', open: '07:00', close: '24:00' },
      { day: 'Παρασκευή', open: '07:00', close: '02:00' },
      { day: 'Σάββατο', open: '07:00', close: '02:00' },
      { day: 'Κυριακή', open: '08:00', close: '24:00' }
    ],
    phone: '2310987654',
    website: 'https://mcdonalds.gr',
    active: true,
    offers: [
      {
        id: 'offer-3',
        title: 'Έκπτωση 20% σε όλα τα menu',
        description: 'Απολαύστε τα αγαπημένα σας menu με έκπτωση 20%',
        discount_text: '20%',
        valid_from: '2025-01-01T00:00:00Z',
        valid_until: '2025-01-31T23:59:59Z',
        image_url: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg',
        is_active: true
      }
    ]
  },
  {
    id: '5',
    name: 'Zara Πανεπιστημίου',
    description: 'Μόδα και στυλ για κάθε περίσταση',
    categoryId: 'shopping',
    tier: 'unicorns',
    address: 'Πανεπιστημίου 25, Θεσσαλονίκη 54626',
    location: {
      lat: 40.6270,
      lng: 22.9600
    },
    photos: [
      'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg',
      'https://images.pexels.com/photos/264507/pexels-photo-264507.jpeg'
    ],
    hours: [
      { day: 'Δευτέρα', open: '10:00', close: '21:00' },
      { day: 'Τρίτη', open: '10:00', close: '21:00' },
      { day: 'Τετάρτη', open: '10:00', close: '21:00' },
      { day: 'Πέμπτη', open: '10:00', close: '21:00' },
      { day: 'Παρασκευή', open: '10:00', close: '21:00' },
      { day: 'Σάββατο', open: '10:00', close: '21:00' },
      { day: 'Κυριακή', open: '11:00', close: '20:00' }
    ],
    phone: '2310555666',
    website: 'https://zara.com',
    active: true,
    offers: [
      {
        id: 'offer-4',
        title: 'Έκπτωση 30% στη νέα συλλογή',
        description: 'Έκπτωση 30% στη νέα ανοιξιάτικη συλλογή',
        discount_text: '30%',
        valid_from: '2025-01-01T00:00:00Z',
        valid_until: '2025-02-28T23:59:59Z',
        image_url: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg',
        is_active: true
      }
    ]
  },
  {
    id: '6',
    name: 'Pizza Hut Φλέμινγκ',
    description: 'Νόστιμες πίτσες και ιταλικές γεύσεις',
    categoryId: 'restaurant',
    tier: 'classics',
    address: 'Φλέμινγκ 30, Θεσσαλονίκη 54627',
    location: {
      lat: 40.6165,
      lng: 22.9700
    },
    photos: [
      'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
    ],
    hours: [
      { day: 'Δευτέρα', open: '11:00', close: '23:00' },
      { day: 'Τρίτη', open: '11:00', close: '23:00' },
      { day: 'Τετάρτη', open: '11:00', close: '23:00' },
      { day: 'Πέμπτη', open: '11:00', close: '23:00' },
      { day: 'Παρασκευή', open: '11:00', close: '24:00' },
      { day: 'Σάββατο', open: '11:00', close: '24:00' },
      { day: 'Κυριακή', open: '12:00', close: '23:00' }
    ],
    phone: '2310777888',
    website: 'https://pizzahut.gr',
    active: true,
    offers: [
      {
        id: 'offer-5',
        title: '1+1 Δωρεάν πίτσα',
        description: 'Αγοράστε μια πίτσα και πάρτε μια δεύτερη δωρεάν',
        discount_text: '1+1 Δωρεάν',
        valid_from: '2025-01-01T00:00:00Z',
        valid_until: '2025-01-25T23:59:59Z',
        image_url: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
        is_active: true
      }
    ]
  }
];