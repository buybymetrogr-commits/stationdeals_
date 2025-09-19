import { SuperDeal } from '../types';

export const superDeals: SuperDeal[] = [
  {
    id: 'deal-1',
    brand: 'McDonalds',
    stationId: 'venizelou',
    distance: 150,
    description: 'Απολαύστε τα αγαπημένα σας menu με έκπτωση 20%',
    discount: '20%',
    validUntil: '2025-01-31',
    image: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg'
  },
  {
    id: 'deal-2',
    brand: 'Starbucks',
    stationId: 'agia-sofia',
    distance: 120,
    description: 'Με κάθε αγορά καφέ, πάρτε ένα pastry δωρεάν',
    discount: 'Δωρεάν pastry',
    validUntil: '2025-01-15',
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'
  },
  {
    id: 'deal-3',
    brand: 'Zara',
    stationId: 'sintrivani',
    distance: 180,
    description: 'Έκπτωση 30% στη νέα ανοιξιάτικη συλλογή',
    discount: '30%',
    validUntil: '2025-02-28',
    image: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg'
  },
  {
    id: 'deal-4',
    brand: 'Pharmacy Plus',
    stationId: 'panepistimio',
    distance: 95,
    description: 'Έκπτωση 15% σε όλα τα προϊόντα ομορφιάς και περιποίησης',
    discount: '15%',
    validUntil: '2025-01-20',
    image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg'
  },
  {
    id: 'deal-5',
    brand: 'Pizza Hut',
    stationId: 'fleming',
    distance: 160,
    description: 'Αγοράστε μια πίτσα και πάρτε μια δεύτερη δωρεάν',
    discount: '1+1 Δωρεάν',
    validUntil: '2025-01-25',
    image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg'
  }
];