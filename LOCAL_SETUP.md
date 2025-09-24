# Local Development Setup for IntelliJ

This guide will help you set up the CineHub Pro application for local development in IntelliJ IDEA.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- IntelliJ IDEA (with Node.js plugin)
- PostgreSQL database (local or cloud-based)

## Setup Steps

### 1. Environment Variables
Copy the environment template and configure your secrets:

```bash
cp .env.example .env
```

Then edit `.env` with your actual API keys and credentials:

### 2. Required API Keys and Services

#### Essential Services (Required):
- **TMDB API**: Get from [themoviedb.org](https://www.themoviedb.org/settings/api)
- **PostgreSQL Database**: Use Neon, Supabase, or local PostgreSQL
- **JWT & Session Secrets**: Generate random 32+ character strings

#### Optional Services:
- **Cloudinary**: For image uploads - [cloudinary.com](https://cloudinary.com/console)
- **SendGrid**: For email OTPs - [sendgrid.com](https://app.sendgrid.com/settings/api_keys)  
- **Twilio**: For SMS OTPs - [twilio.com](https://console.twilio.com/)
- **OAuth Providers**: Google, Facebook, GitHub, Twitter (for social login)

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

Push the database schema:

```bash
npm run db:push
```

### 5. IntelliJ Configuration

1. Open the project in IntelliJ IDEA
2. Install the Node.js plugin if not already installed
3. Configure Node.js interpreter: File → Settings → Languages & Frameworks → Node.js
4. Set up run configurations:
   - **Development**: `npm run dev`
   - **Build**: `npm run build`
   - **Database Push**: `npm run db:push`

### 6. Run the Application

```bash
npm run dev
```

The application will start on `http://localhost:5000`

## Default Admin User

In development mode, an admin user will be created automatically:
- Username: `admin` (or set `ADMIN_USERNAME`)
- Email: `admin@example.com` (or set `ADMIN_EMAIL`)  
- Password: `admin123` (or set `ADMIN_PASSWORD`)

## Development Notes

- The app runs both backend and frontend on port 5000
- Hot reload is enabled for development
- Database migrations are handled via `npm run db:push`
- Check the console for any missing environment variables

## Troubleshooting

- If build fails, clear `node_modules` and reinstall
- Ensure PostgreSQL is accessible with the connection string
- Check that all required environment variables are set
- For OAuth issues, verify redirect URIs match your local setup

## Project Structure

- `client/` - React frontend
- `server/` - Express.js backend  
- `shared/` - Shared schemas and types
- `drizzle/` - Database schema and migrations