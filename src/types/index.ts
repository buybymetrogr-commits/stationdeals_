export interface MetroStation {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  lines: string[];
  status: 'planned' | 'under-construction' | 'operational';
  active?: boolean; // Add active field
}

export interface BusinessCategory {
  id: string;
  name: string;
  icon: string; // Lucide icon name
}

export interface BusinessHours {
  day: string;
  open: string; // Format: "09:00"
  close: string; // Format: "18:00"
  closed?: boolean;
}

export interface BusinessOffer {
  id: string;
  brand?: string;
  title: string;
  description?: string;
  discount_text: string;
  valid_from: string;
  valid_until: string;
  image_url?: string;
  is_active: boolean;
}

export type BusinessTier = 'next-door' | 'unicorns' | 'classics';

export interface Business {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  tier?: BusinessTier; // New tier field
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  photos: string[];
  distance?: number; // Distance from selected metro station in meters
  hours: BusinessHours[];
  phone?: string;
  website?: string;
  offers?: BusinessOffer[]; // Replace reviews with offers
  active?: boolean;
  createdAt?: string;
}

export interface SuperDeal {
  id: string;
  brand: string;
  stationId: string;
  distance?: number;
  description: string;
  discount: string;
  validUntil: string;
  image: string;
}

export interface FilterState {
  selectedStation: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  maxDistance: number; // in meters
}