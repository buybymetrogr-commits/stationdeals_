/*
  # Add payment fields to offers table

  1. Changes
    - Add payment_status column to track payment approval status
    - Add payment_amount column to store the payment amount
    - Add payment_approved_at column to track when payment was approved
    - Add payment_approved_by column to track which admin approved the payment

  2. Security
    - Update RLS policies to handle payment status
*/

-- Add payment-related columns to offers table
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS payment_amount decimal(10,2) DEFAULT 4.99,
ADD COLUMN IF NOT EXISTS payment_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_approved_by uuid REFERENCES auth.users(id);

-- Update the existing policy to only show active offers that are also payment approved
DROP POLICY IF EXISTS "Public can view active offers" ON offers;

CREATE POLICY "Public can view approved offers"
  ON offers
  FOR SELECT
  TO public
  USING (is_active = true AND payment_status = 'approved');

-- Add policy for business owners to view their own offers regardless of payment status
CREATE POLICY "Business owners can view their own offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (
    is_business_owner() AND 
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = offers.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Add policy for admins to view all offers for payment approval
CREATE POLICY "Admins can view all offers for approval"
  ON offers
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Add policy for admins to update payment status
CREATE POLICY "Admins can update payment status"
  ON offers
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());