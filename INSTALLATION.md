# Wallet & Transaction Management App - Installation & Setup Guide

## Overview
This is a **Next.js full-stack application** with an integrated backend. No separate server needed - everything runs with `npm run dev`.

## Prerequisites
- **Node.js** 18+ installed
- **MongoDB** running locally or MongoDB Atlas connection string

## Installation Steps

### 1. Start MongoDB

**Option A: Local MongoDB**
\`\`\`bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows - run MongoDB Community Server from Services
\`\`\`

Verify MongoDB is running:
\`\`\`bash
mongosh
# Should connect successfully
\`\`\`

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/wallet_db`
4. Update `.env.local` with your connection string

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Create Users

Before running the app, create your admin and user accounts:

\`\`\`bash
# Create admin user
npm run create:user "Admin Name" "admin@example.com" "admin123" "admin"

# Create regular user
npm run create:user "John Doe" "john@example.com" "user123" "user"

# Create another user
npm run create:user "Jane Smith" "jane@example.com" "pass123" "user"
\`\`\`

### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit **http://localhost:3000** and login with created credentials.

## Build for Production
\`\`\`bash
npm run build
npm run start
\`\`\`

## Project Structure

\`\`\`
wallet-and-transactions/
├── app/
│   ├── api/                  # Next.js API routes (backend)
│   │   ├── auth/            # Authentication endpoints
│   │   ├── users/           # User management
│   │   └── transactions/    # Transaction management
│   ├── page.tsx             # Main page
│   └── layout.tsx           # App layout
├── lib/
│   ├── db.ts               # MongoDB connection
│   ├── models/             # Mongoose models (User, Transaction)
│   ├── api.ts              # Frontend API client
│   ├── store.ts            # Zustand state management
│   └── auth-token.ts       # JWT utilities
├── components/             # React components
│   ├── login-page.tsx
│   ├── admin-dashboard.tsx
│   ├── user-dashboard.tsx
│   └── settings-modal.tsx
├── .env.local              # Environment variables
├── scripts/
│   └── create-user.js      # User creation CLI
└── package.json
\`\`\`

## Environment Variables

`.env.local` file:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
MONGODB_URI=mongodb://localhost:27017/wallet-app
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `DELETE /api/users/[userId]` - Delete user
- `POST /api/users/[userId]` - Add money to wallet

### Transactions
- `GET /api/transactions` - Get user's transactions
- `GET /api/transactions?admin=true` - Get all transactions (admin)
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/[transactionId]?action=approve` - Approve transaction (admin)
- `POST /api/transactions/[transactionId]?action=reject` - Reject transaction (admin)

## Features

✅ User Authentication (JWT)
✅ Admin Dashboard (User management, Approvals)
✅ User Dashboard (Submit transactions, View history)
✅ Image Upload (Screenshot for transactions)
✅ Wallet Management (Balance tracking, Money transfers)
✅ Transaction Status (Pending, Approved, Rejected)
✅ Password Management (Change password)

## Accounts

Use the `npm run create:user` helper to create your own admin and user accounts before logging in. Credentials come from your database, not demo data.

## Troubleshooting

### MongoDB Connection Error
\`\`\`
Error: connect ECONNREFUSED 127.0.0.1:27017
\`\`\`
**Solution**: Start MongoDB service (see "Start MongoDB" section above)

### Port Already in Use
\`\`\`bash
# Change port
npm run dev -- -p 3001
\`\`\`

### User Creation Fails
- Check MongoDB is running
- Verify `.env.local` has correct `MONGODB_URI`
- Clear database and try again

## Support

For issues, check:
1. MongoDB is running
2. Environment variables in `.env.local`
3. Node.js version is 18+
