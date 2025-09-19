/*
  # Add OpenStreetMap integration

  1. New Columns
    - `osm_id` (text) - OpenStreetMap ID for imported businesses
    - `import_status` (text) - Track the source/status of business data

  2. Functions
    - `import_osm_business` - Function to import/update businesses from OSM

  3. Indexes
    - Unique index on osm_id to prevent duplicates

  4. Security
    - Updated RLS policies to handle OSM imports
*/

-- Add columns for OSM data tracking
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS osm_id text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS import_status text DEFAULT 'manual' CHECK (import_status IN ('manual', 'osm_import', 'osm_updated'));

-- Create unique index on osm_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS businesses_osm_id_idx ON businesses (osm_id) WHERE osm_id IS NOT NULL;

-- Create function to import OSM businesses
CREATE OR REPLACE FUNCTION import_osm_business(
  osm_id text,
  name text,
  description text,
  category_id text,
  address text,
  lat double precision,
  lng double precision,
  phone text DEFAULT NULL,
  website text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  business_id uuid;
BEGIN
  -- Check if business with this OSM ID already exists
  SELECT id INTO business_id FROM businesses WHERE businesses.osm_id = import_osm_business.osm_id;
  
  IF business_id IS NOT NULL THEN
    -- Update existing business
    UPDATE businesses SET
      name = import_osm_business.name,
      description = import_osm_business.description,
      category_id = import_osm_business.category_id,
      address = import_osm_business.address,
      lat = import_osm_business.lat,
      lng = import_osm_business.lng,
      phone = import_osm_business.phone,
      website = import_osm_business.website,
      import_status = 'osm_updated',
      updated_at = now()
    WHERE id = business_id;
  ELSE
    -- Insert new business
    INSERT INTO businesses (
      name,
      description,
      category_id,
      address,
      lat,
      lng,
      phone,
      website,
      osm_id,
      import_status,
      active
    ) VALUES (
      import_osm_business.name,
      import_osm_business.description,
      import_osm_business.category_id,
      import_osm_business.address,
      import_osm_business.lat,
      import_osm_business.lng,
      import_osm_business.phone,
      import_osm_business.website,
      import_osm_business.osm_id,
      'osm_import',
      true
    )
    RETURNING id INTO business_id;
  END IF;
  
  RETURN business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies for OSM imports
DROP POLICY IF EXISTS "Users can manage their own businesses" ON businesses;
CREATE POLICY "Users can manage their own businesses" ON businesses
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND import_status = 'manual');

-- Allow service role to manage all businesses
DROP POLICY IF EXISTS "Service role can manage all businesses" ON businesses;
CREATE POLICY "Service role can manage all businesses" ON businesses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);