    interface Location {
  lat: number;
  lng: number;
};
  title: string;
  description: string;
  discountText: string;
  validFrom: string;
  validUntil: string;
  imageUrl: string;
import { SuperDeal } from '../types';
export const stationDeals = [
  {
    id: 'deal-1',
    brand: 'McDonalds',
    businessId: 'mcdonalds-venizelou',
    businessName: 'McDonald\'s Βενιζέλου',
    categoryId: 'restaurant',
    address: 'Βενιζέλου 50, Θεσσαλονίκη 54624',
    location: {
      lat: 40.6365,
      lng: 22.9388
    },
    title: 'Έκπτωση σε όλα τα menu',
    description: 'Απολαύστε τα αγαπημένα σας menu με έκπτωση 20%',
    discountText: '20%',
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-01-31T23:59:59Z',
    imageUrl: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg',
    stationId: 'venizelou',
  },
  {
    id: 'deal-2',
    brand: 'Starbucks',
    businessId: 'starbucks-agia-sofia',
    businessName: 'Starbucks Αγία Σοφία',
    categoryId: 'cafe',
    address: 'Αγίας Σοφίας 35, Θεσσαλονίκη 54622',
    location: {
      lat: 40.6330,
      lng: 22.9420
    },
    title: 'Δωρεάν pastry με κάθε καφέ',
    description: 'Με κάθε αγορά καφέ, πάρτε ένα pastry δωρεάν',
    discountText: 'Δωρεάν pastry',
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-01-15T23:59:59Z',
    imageUrl: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
    stationId: 'agia-sofia',
  },
  {
    id: 'deal-3',
    brand: 'Zara',
    businessId: 'zara-sintrivani',
    businessName: 'Zara Συντριβάνι',
    categoryId: 'shopping',
    address: 'Τσιμισκή 100, Θεσσαλονίκη 54622',
    location: {
      lat: 40.6300,
      lng: 22.9540
    },
    title: 'Έκπτωση στη νέα συλλογή',
    description: 'Έκπτωση 30% στη νέα ανοιξιάτικη συλλογή',
    discountText: '30%',
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-02-28T23:59:59Z',
    imageUrl: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg',
    stationId: 'sintrivani',
  },
  {
    id: 'deal-4',
    brand: 'Pharmacy Plus',
    businessId: 'pharmacy-plus-panepistimio',
    businessName: 'Pharmacy Plus Πανεπιστήμιο',
    categoryId: 'health',
    address: 'Πανεπιστημίου 25, Θεσσαλονίκη 54624',
    location: {
      lat: 40.6275,
      lng: 22.9600
    },
    title: 'Έκπτωση σε προϊόντα ομορφιάς',
    description: 'Έκπτωση 15% σε όλα τα προϊόντα ομορφιάς και περιποίησης',
    discountText: '15%',
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-01-20T23:59:59Z',
    imageUrl: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
    stationId: 'panepistimio',
  },
  {
    id: 'deal-5',
    brand: 'Pizza Hut',
    businessId: 'pizza-hut-fleming',
    businessName: 'Pizza Hut Φλέμινγκ',
    categoryId: 'restaurant',
    address: 'Φλέμινγκ 15, Θεσσαλονίκη 54634',
    location: {
      lat: 40.6168,
      lng: 22.9700
    },
    title: 'Αγοράστε 1 πάρτε 1 δωρεάν',
    description: 'Αγοράστε μια πίτσα και πάρτε μια δεύτερη δωρεάν',
    discountText: '1+1 Δωρεάν',
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-01-25T23:59:59Z',
    imageUrl: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
    stationId: 'fleming',
  },
  {
    businessId: string,
    description: 'Αγοράστε 1 πάρτε 1 δωρεάν',
    businessName: string,
    discount: '1+1 Δωρεάν',
    categoryId: string,
    validUntil: '2025-01-25',
    lat: number
  }
]