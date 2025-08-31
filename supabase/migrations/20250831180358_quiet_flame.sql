/*
  # Initial Schema for Break The Fear Fee Management System

  1. New Tables
    - `users` - System users with role-based access
    - `institutions` - Educational institutions
    - `batches` - Student batches/groups
    - `courses` - Courses within batches
    - `months` - Course months with fees
    - `students` - Student information and enrollment
    - `student_enrollments` - Student course enrollments with start/end months
    - `payments` - Fee payments with detailed breakdown
    - `payment_months` - Individual month payments within a payment
    - `reference_options` - Payment reference options
    - `received_by_options` - Payment receiver options
    - `activities` - System activity logs

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Secure sensitive data access

  3. Features
    - Role-based access control (admin, manager, developer)
    - Complete student enrollment tracking
    - Detailed payment processing with discounts
    - Activity logging for audit trails
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'developer')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Months table
CREATE TABLE IF NOT EXISTS months (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  month_number integer NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id text UNIQUE NOT NULL,
  name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female', 'Custom')),
  phone text NOT NULL,
  guardian_name text NOT NULL,
  guardian_phone text NOT NULL,
  institution_id uuid NOT NULL REFERENCES institutions(id),
  batch_id uuid NOT NULL REFERENCES batches(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Student enrollments table
CREATE TABLE IF NOT EXISTS student_enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  starting_month_id uuid REFERENCES months(id),
  ending_month_id uuid REFERENCES months(id),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  UNIQUE(student_id, course_id)
);

-- Reference options table
CREATE TABLE IF NOT EXISTS reference_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Received by options table
CREATE TABLE IF NOT EXISTS received_by_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number text UNIQUE NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  discount_type text CHECK (discount_type IN ('fixed', 'percentage')),
  discounted_amount decimal(10,2) NOT NULL DEFAULT 0,
  paid_amount decimal(10,2) NOT NULL DEFAULT 0,
  due_amount decimal(10,2) NOT NULL DEFAULT 0,
  reference text,
  received_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Payment months table (detailed breakdown of payments per month)
CREATE TABLE IF NOT EXISTS payment_months (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  month_id uuid NOT NULL REFERENCES months(id),
  month_fee decimal(10,2) NOT NULL DEFAULT 0,
  paid_amount decimal(10,2) NOT NULL DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  previously_paid decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Activities table for audit logging
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  description text NOT NULL,
  data jsonb DEFAULT '{}',
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_by_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Developers can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

CREATE POLICY "Developers can insert users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

CREATE POLICY "Developers can update users" ON users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

-- RLS Policies for other tables (authenticated users can access based on role)
CREATE POLICY "Authenticated users can read institutions" ON institutions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage institutions" ON institutions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read batches" ON batches
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and developer can manage batches" ON batches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Authenticated users can read courses" ON courses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and developer can manage courses" ON courses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Authenticated users can read months" ON months
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin and developer can manage months" ON months
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Authenticated users can read students" ON students
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage students" ON students
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read enrollments" ON student_enrollments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage enrollments" ON student_enrollments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read reference options" ON reference_options
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Developer can manage reference options" ON reference_options
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

CREATE POLICY "Authenticated users can read received by options" ON received_by_options
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Developer can manage received by options" ON received_by_options
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'developer'
    )
  );

CREATE POLICY "Authenticated users can read payments" ON payments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payments" ON payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read payment months" ON payment_months
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payment months" ON payment_months
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin and developer can read activities" ON activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Authenticated users can insert activities" ON activities
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Insert default reference options
INSERT INTO reference_options (name) VALUES 
  ('Cash Payment'),
  ('Bank Transfer'),
  ('Mobile Banking'),
  ('Check Payment')
ON CONFLICT (name) DO NOTHING;

-- Insert default received by options
INSERT INTO received_by_options (name) VALUES 
  ('Reception Desk'),
  ('Admin Office'),
  ('Accounts Department')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_courses_batch_id ON courses(batch_id);
CREATE INDEX IF NOT EXISTS idx_months_course_id ON months(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON student_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_months_payment_id ON payment_months(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_months_month_id ON payment_months(month_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_months_updated_at BEFORE UPDATE ON months FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();