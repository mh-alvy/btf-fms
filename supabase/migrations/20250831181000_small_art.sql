/*
  # Fix user creation RLS policies

  1. Security Updates
    - Allow anonymous users to insert users only when table is empty (for initial seeding)
    - Allow authenticated developers to manage users
    - Allow users to read their own data
    - Ensure proper RLS enforcement

  2. Changes
    - Drop existing conflicting policies
    - Create new policy allowing initial user creation by anon role
    - Maintain security for subsequent operations
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow initial user creation" ON users;
DROP POLICY IF EXISTS "Developers can insert users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Developers can read all users" ON users;
DROP POLICY IF EXISTS "Developers can update users" ON users;

-- Allow anonymous users to insert users only when table is empty (for initial seeding)
CREATE POLICY "Allow initial user creation"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK ((SELECT count(*) FROM users) = 0);

-- Allow developers to insert new users after initial setup
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

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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