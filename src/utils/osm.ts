import { Business, BusinessCategory } from '../types';
import { categories } from '../data/categories';

const OSM_CATEGORIES = {
  health: ['pharmacy'],
  restaurant: ['restaurant', 'fast_food'],
  cafe: ['cafe', 'coffee_shop'],
  bar: ['bar', 'pub', 'nightclub'],
  retail: ['convenience', 'supermarket', 'clothes', 'shoes', 'jewelry', 'books'],
  grocery: ['supermarket', 'convenience', 'grocery'],
  entertainment: ['cinema', 'theatre', 'arts_centre', 'nightclub'],
  services: ['bank', 'post_office', 'library', 'school', 'university']
};

const CATEGORY_PHOTOS = {
  health: [
    'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
    'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg'
  ],
  restaurant: [
    'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg',
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
  ],
  cafe: [
    'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg',
    'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'
  ],
  bar: [
    'https://images.pexels.com/photos/274192/pexels-photo-274192.jpeg',
    'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg'
  ],
  retail: [
    'https://images.pexels.com/photos/264507/pexels-photo-264507.jpeg',
    'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg'
  ],
  grocery: [
    'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg',
    'https://images.pexels.com/photos/3962294/pexels-photo-3962294.jpeg'
  ],
  entertainment: [
    'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg',
    'https://images.pexels.com/photos/7991158/pexels-photo-7991158.jpeg'
  ],
  services: [
    'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
    'https://images.pexels.com/photos/937481/pexels-photo-937481.jpeg'
  ]
};

interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    shop?: string;
    opening_hours?: string;
    phone?: string;
    website?: string;
    description?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
  };
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, baseDelay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Check if we hit rate limits
      if (response.status === 429) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`Rate limited by OSM API, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      // Check for other error responses
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`Failed to fetch OSM data, retrying in ${delay}ms...`, error);
      await sleep(delay);
    }
  }
  
  throw new Error('Failed to fetch OSM data after multiple retries');
}

export async function fetchNearbyBusinesses(lat: number, lng: number, radius: number = 500): Promise<Business[]> {
  const query = `
    [out:json][timeout:25];
    (
      node[~"^(amenity|shop)$"~"."](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetchWithRetry(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    return data.elements
      .filter((element: OSMNode) => element.tags?.name)
      .map((element: OSMNode) => convertOSMToBusiness(element));
  } catch (error) {
    console.error('Error fetching OSM data:', error);
    // Re-throw with a more user-friendly message
    throw new Error(`Failed to fetch nearby businesses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function convertOSMToBusiness(node: OSMNode): Business {
  const category = determineCategory(node.tags);
  const photos = CATEGORY_PHOTOS[category.id as keyof typeof CATEGORY_PHOTOS] || CATEGORY_PHOTOS.services;
  
  // Construct address from OSM tags
  const address = [
    node.tags['addr:street'],
    node.tags['addr:housenumber']
  ].filter(Boolean).join(' ') || 'Άγνωστη διεύθυνση';

  return {
    id: `osm-${node.id}`,
    name: node.tags.name || 'Άγνωστη Επιχείρηση',
    description: node.tags.description || `${category.name} στην περιοχή`,
    categoryId: category.id,
    address,
    location: {
      lat: node.lat,
      lng: node.lon
    },
    photos,
    hours: parseOpeningHours(node.tags.opening_hours),
    phone: node.tags.phone,
    website: node.tags.website,
    active: true
  };
}

function determineCategory(tags: OSMNode['tags']): BusinessCategory {
  if (tags.amenity === 'pharmacy') {
    return categories.find(c => c.id === 'health') || categories[0];
  }
  
  for (const [categoryId, osmTypes] of Object.entries(OSM_CATEGORIES)) {
    if (
      osmTypes.includes(tags.amenity || '') || 
      osmTypes.includes(tags.shop || '')
    ) {
      const category = categories.find(c => c.id === categoryId);
      if (category) return category;
    }
  }
  
  return categories.find(c => c.id === 'services') || categories[0];
}

function parseOpeningHours(openingHours?: string): Business['hours'] {
  const defaultHours = [
    { day: 'Δευτέρα', open: '09:00', close: '21:00', closed: false },
    { day: 'Τρίτη', open: '09:00', close: '21:00', closed: false },
    { day: 'Τετάρτη', open: '09:00', close: '21:00', closed: false },
    { day: 'Πέμπτη', open: '09:00', close: '21:00', closed: false },
    { day: 'Παρασκευή', open: '09:00', close: '21:00', closed: false },
    { day: 'Σάββατο', open: '09:00', close: '15:00', closed: false },
    { day: 'Κυριακή', open: '', close: '', closed: true }
  ];

  if (!openingHours) {
    return defaultHours;
  }

  // For now, return default hours
  // TODO: Implement proper opening hours parsing from OSM format
  return defaultHours;
}