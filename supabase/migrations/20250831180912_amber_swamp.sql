/*
  # Fix User Creation RLS Policies

  1. Security Updates
    - Add policy to allow initial user creation when no users exist
    - Add policy for developers to manage users
    - Ensure proper RLS policies for ongoing operations

  2. Changes
    - Allow user creation when users table is empty (for initial setup)
    - Restrict user management to developers only after initial setup
    - Maintain security while enabling proper functionality
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Developers can insert users" ON users;
DROP POLICY IF EXISTS "Developers can read all users" ON users;
DROP POLICY IF EXISTS "Developers can update users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Allow initial user creation when no users exist (for seeding default users)
CREATE POLICY "Allow initial user creation"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM users LIMIT 1)
  );

-- Allow developers to insert new users (after initial setup)
CREATE POLICY "Developers can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

-- Allow developers to read all users
CREATE POLICY "Developers can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

-- Allow developers to update users
CREATE POLICY "Developers can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);