import { Business } from '../types';

export const businesses: Business[] = [
  {
    id: '1',
    name: 'Φαρμακείο Παπαδόπουλος',
    description: 'Πλήρες φαρμακείο με ευρεία γκάμα προϊόντων υγείας και ομορφιάς',
    categoryId: 'health',
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
    reviews: [
      {
        id: 'r1',
        userName: 'Γιώργος Π.',
        rating: 5,
        comment: 'Εξαιρετική εξυπηρέτηση και πολύ καλές τιμές!',
        date: '2025-03-15'
      },
      {
        id: 'r2',
        userName: 'Μαρία Κ.',
        rating: 4,
        comment: 'Πολύ καλή εξυπηρέτηση και μεγάλη ποικιλία.',
        date: '2025-02-28'
      }
    ],
    averageRating: 4.5
  },
  {
    id: '2',
    name: 'Φαρμακείο Αγίας Σοφίας',
    description: 'Σύγχρονο φαρμακείο με εξειδικευμένο προσωπικό',
    categoryId: 'health',
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
    reviews: [
      {
        id: 'r3',
        userName: 'Ελένη Μ.',
        rating: 5,
        comment: 'Άριστη εξυπηρέτηση και συμβουλές!',
        date: '2025-04-02'
      },
      {
        id: 'r4',
        userName: 'Κώστας Α.',
        rating: 4,
        comment: 'Πολύ καλό φαρμακείο με ευγενικό προσωπικό.',
        date: '2025-03-21'
      }
    ],
    averageRating: 4.5
  }
];