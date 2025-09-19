/*
  # Create businesses and related tables

  1. New Tables
    - `businesses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category_id` (text)
      - `address` (text)
      - `lat` (double precision)
      - `lng` (double precision)
      - `phone` (text)
      - `website` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `business_photos`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `url` (text)
      - `order` (integer)
      - `created_at` (timestamptz)
    
    - `business_hours`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `day` (text)
      - `open` (text)
      - `close` (text)
      - `closed` (boolean)
      - `created_at` (timestamptz)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `rating` (integer)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own businesses
    - Add policies for public read access
*/

-- Create businesses table
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id text NOT NULL,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  phone text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id)
);

-- Create business_photos table
CREATE TABLE business_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create business_hours table
CREATE TABLE business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  day text NOT NULL,
  open text,
  close text,
  closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for businesses
CREATE POLICY "Public businesses are viewable by everyone"
  ON businesses
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own businesses"
  ON businesses
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own businesses"
  ON businesses
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own businesses"
  ON businesses
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Policies for business_photos
CREATE POLICY "Public photos are viewable by everyone"
  ON business_photos
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage photos of their own businesses"
  ON business_photos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_photos.business_id 
      AND owner_id = auth.uid()
    )
  );

-- Policies for business_hours
CREATE POLICY "Public hours are viewable by everyone"
  ON business_hours
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage hours of their own businesses"
  ON business_hours
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_hours.business_id 
      AND owner_id = auth.uid()
    )
  );

-- Policies for reviews
CREATE POLICY "Public reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();