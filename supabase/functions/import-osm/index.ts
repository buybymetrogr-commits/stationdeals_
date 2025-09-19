import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    shop?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    phone?: string;
    website?: string;
    description?: string;
  };
}

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

function determineCategory(tags: OSMNode['tags']): string {
  if (tags.amenity === 'pharmacy') return 'health';
  
  for (const [categoryId, osmTypes] of Object.entries(OSM_CATEGORIES)) {
    if (osmTypes.includes(tags.amenity || '') || osmTypes.includes(tags.shop || '')) {
      return categoryId;
    }
  }
  
  return 'services';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lat, lng, radius = 500 } = await req.json();

    if (!lat || !lng) {
      throw new Error('Missing required parameters: lat, lng');
    }

    // Fetch businesses from OSM
    const query = `
      [out:json][timeout:25];
      (
        node[~"^(amenity|shop)$"~"."](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;

    const osmResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });

    if (!osmResponse.ok) {
      throw new Error(`OSM API error: ${osmResponse.status}`);
    }

    const osmData = await osmResponse.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process each business
    const results = await Promise.all(
      osmData.elements
        .filter((node: OSMNode) => node.tags?.name)
        .map(async (node: OSMNode) => {
          const address = [
            node.tags['addr:street'],
            node.tags['addr:housenumber']
          ].filter(Boolean).join(' ') || 'Άγνωστη διεύθυνση';

          const { data, error } = await supabaseClient.rpc('import_osm_business', {
            osm_id: `osm-${node.id}`,
            name: node.tags.name || 'Άγνωστη Επιχείρηση',
            description: node.tags.description || 'Επιχείρηση από το OpenStreetMap',
            category_id: determineCategory(node.tags),
            address,
            lat: node.lat,
            lng: node.lon,
            phone: node.tags.phone,
            website: node.tags.website
          });

          if (error) {
            console.error('Error importing business:', error);
            return { success: false, error: error.message, osmId: node.id };
          }

          return { success: true, businessId: data, osmId: node.id };
        })
    );

    return new Response(
      JSON.stringify({
        success: true,
        results,
        imported: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});