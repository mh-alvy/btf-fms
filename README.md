# Break The Fear - Fee Management System

A modern fee management system built with Next.js frontend and NestJS backend, using Supabase as the database.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and Zustand for state management
- **Backend**: NestJS with TypeScript, JWT authentication, and Supabase integration
- **Database**: Supabase (PostgreSQL) with Row Level Security

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment variables:**
   
   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
   
   **Backend** (`backend/.env`):
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your-jwt-secret-key
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend on http://localhost:3000
   - Backend on http://localhost:3001

## 🔐 Default Credentials

- **Admin**: admin / admin123
- **Manager**: manager / manager123  
- **Developer**: developer / dev123

## 📁 Project Structure

```
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and stores
│   └── ...
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # Users management
│   │   ├── students/       # Students management
│   │   ├── payments/       # Payment processing
│   │   └── ...
│   └── ...
└── supabase/               # Database migrations
    └── migrations/
```

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control (Admin, Manager, Developer)
- Password hashing with bcrypt
- Row Level Security (RLS) in Supabase
- Input validation and sanitization

## 🎯 Features

- **User Management**: Role-based access control
- **Student Management**: Complete student database with enrollment tracking
- **Fee Payment**: Advanced payment processing with discount support
- **Batch & Course Management**: Organize students by batches and courses
- **Reports**: Comprehensive payment and discount reports
- **Invoice Generation**: Professional thermal printer-ready invoices
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run start:dev
```

### Building for Production
```bash
npm run build
```

## 📊 Database Schema

The system uses the existing Supabase schema with tables for:
- users (authentication and roles)
- institutions (educational institutions)
- batches (student groups)
- courses (subjects/courses)
- months (payment periods)
- students (student information)
- student_enrollments (course enrollments)
- payments (fee payments)
- payment_months (detailed payment breakdown)
- activities (audit log)
- reference_options (payment references)
- received_by_options (payment receivers)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.