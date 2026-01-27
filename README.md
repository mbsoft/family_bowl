# Family Bowl - Super Bowl Prop Bet Tracker

[![CI](https://github.com/mbsoft/family_bowl/actions/workflows/ci.yml/badge.svg)](https://github.com/mbsoft/family_bowl/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-31%25-orange)](https://github.com/mbsoft/family_bowl)


A Next.js web application for tracking Super Bowl prop bets among family and friends. Users can submit their picks, view everyone's selections (after locked), and track scores once results are locked.

## Features

### User Features
- **Invite-based Registration**: Users receive unique invite links from the admin to create their accounts
- **Bet Submission**: Submit picks for all prop bet questions
- **View All Picks**: After picks are locked, view everyone's selections in a transposed table format
- **Real-time Scoring**: See color-coded results (green for correct, red for incorrect) and point totals
- **Auto-refresh**: View picks table automatically refreshes every 2 seconds to show updates

### Admin Features
- **User Management**: 
  - Generate invite links with optional default usernames
  - View all registered users
  - Delete users (automatically deletes associated submissions)
- **Bet Management**:
  - Create, edit, and delete prop bet questions
  - Reorder bets using up/down buttons
  - Define custom bet types with options and labels
  - Support for integer range bet types (e.g., "Total points scored")
- **Bet Type Management**: Create and configure custom bet types with:
  - Multiple choice options
  - Custom option labels
  - Team selection support
  - Integer range support (min/max values)
- **Submission Management**:
  - View all user submissions
  - Edit user submissions
  - Delete user submissions
- **Picks Lockdown**: Lock all picks to prevent users from modifying their submissions
- **Bet Results**: Set correct results for each bet after picks are locked
- **Data Export**: Export all submissions to Excel (XLSX) format
- **View All Picks**: Access the picks table from admin dashboard at any time

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Database**: Turso (libSQL/SQLite)
- **Analytics**: Vercel Analytics
- **Export**: XLSX library for Excel exports
- **Testing**: Vitest with React Testing Library

## Prerequisites

- Node.js 18+ and npm
- A Turso database account (sign up at [turso.tech](https://turso.tech))
- Environment variables configured (see Setup section)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/mbsoft/family_bowl.git
cd family_bowl
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Authentication (optional - admin credentials are hardcoded)
USER_ADMIN_PASSWORD=bosslevel
```

**Getting Turso Credentials:**
1. Sign up at [turso.tech](https://turso.tech)
2. Create a new database
3. Copy the database URL and auth token
4. Add them to your `.env.local` file

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Initial Setup

1. **Login as Admin**
2. **Create Bet Types**: Navigate to "Manage Bet Types" to define your bet types
3. **Create Bets**: Navigate to "Manage Bets" to add prop bet questions
4. **Generate Invites**: Navigate to "Manage Invites" to create invite links for users
5. **Share Invites**: Send invite links to users so they can register

## Database Schema

The application uses the following tables:

- **bets**: Prop bet questions
- **bet_types**: Bet type definitions (options, labels, etc.)
- **submissions**: User bet selections
- **invites**: Invite link tokens
- **user_credentials**: User account credentials
- **bet_results**: Correct results for each bet
- **app_settings**: Application settings (e.g., picks lock status)

## Usage Guide

### For Users

1. **Registration**: Click on an invite link sent by the admin
2. **Set Credentials**: Choose a username and password
3. **Submit Picks**: Navigate to "My Picks" and select your choices for each bet
4. **View Results**: After picks are locked, view everyone's picks and scores in the "View All Picks" table

### For Admins

1. **Manage Bet Types**: Define custom bet types with options and labels
2. **Create Bets**: Add prop bet questions, selecting from available bet types
3. **Generate Invites**: Create invite links, optionally with default usernames
4. **Review Submissions**: View and edit user submissions as needed
5. **Lock Picks**: When ready, lock all picks to prevent further changes
6. **Set Results**: Enter the correct result for each bet
7. **View Scores**: Check the "View All Picks" table to see color-coded results and point totals

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard and management pages
│   │   ├── bet-types/  # Bet type management
│   │   ├── bets/       # Bet question management
│   │   ├── invites/    # Invite link management
│   │   ├── results/    # Set bet results
│   │   ├── submissions/# View/edit submissions
│   │   ├── users/      # User management
│   │   └── export/     # Export to Excel
│   ├── api/
│   │   └── db/        # Database API routes
│   ├── bets/          # User bet submission page
│   ├── invite/        # Invite registration page
│   ├── login/         # Login page
│   └── view-picks/    # View all picks table
├── components/        # Reusable React components
├── lib/
│   ├── auth.js       # Authentication utilities
│   ├── db.js         # Database client initialization
│   └── storage.js    # Database operation wrappers
└── utils/
    └── constants.js  # Bet type constants and utilities
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy

The application will automatically:
- Initialize the database schema on first run
- Enable Vercel Analytics in production

## Authentication

- **Admin**: Username `admin`, password ``
- **Users**: Credentials set via invite links, stored in database

## Key Features Explained

### Bet Types
- **Multiple Choice**: Standard options (e.g., "Over/Under")
- **Team Selection**: Requires team names when creating bets
- **Integer Range**: Numeric input within a specified range (e.g., 0-100)

### Picks Lockdown
Once picks are locked:
- Users cannot modify their submissions
- Users can view everyone's picks
- Admin can set bet results
- Scoring becomes visible with color-coding

### Scoring System
- Each correct answer = 1 point
- Points displayed in summary row at top of table
- Correct picks highlighted in light green
- Incorrect picks highlighted in light red

## Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing.

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Coverage

Coverage reports are generated in the `coverage/` directory. The project maintains minimum coverage thresholds:
- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

See [VITEST_SETUP.md](./VITEST_SETUP.md) for detailed testing documentation.

## Contributing

This is a private family project. For issues or questions, please contact the repository owner.

## License

Private project - All rights reserved.
