# Wallet Management System - Setup Guide

## Overview
This is a Next.js full-stack application with MongoDB database integration. The backend API routes are integrated directly into the Next.js app (no separate Express server needed).

## Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- npm or pnpm package manager

## Installation & Setup

### 1. Install Dependencies
\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### 2. Setup Environment Variables
Create or update `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
MONGODB_URI=mongodb://localhost:27017/wallet-app
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
\`\`\`

**Important:** 
- Replace `MONGODB_URI` with your MongoDB connection string
- Change `JWT_SECRET` to a strong random string in production
- Keep `NEXT_PUBLIC_API_URL` as is for development

### 3. Start MongoDB
Make sure MongoDB is running:

\`\`\`bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
\`\`\`

### 4. Run the Application
\`\`\`bash
npm run dev
\`\`\`

The app will start on `http://localhost:3000`

## Creating Users

### Using CLI Command

#### Create a Regular User
\`\`\`bash
npm run create:user "John Doe" "john@example.com" "password123" "user"
\`\`\`

#### Create an Admin User
\`\`\`bash
npm run create:user "Admin Name" "admin@example.com" "admin123" "admin"
\`\`\`

#### Command Format
\`\`\`bash
npm run create:user "<name>" "<email>" "<password>" "<role>"
\`\`\`

**Parameters:**
- `<name>` - Full name of the user
- `<email>` - Unique email address
- `<password>` - Password (minimum 6 characters recommended)
- `<role>` - Either "admin" or "user" (defaults to "user" if omitted)

### Login Accounts
Create your own admin/user accounts with the CLI commands above. The app authenticates against your database records—no demo credentials are bundled.

## Features

### Admin Dashboard
- View all users and their wallet balances
- Create new users
- Delete users
- Add money to user wallets
- Approve/reject transaction requests
- View transaction screenshots
- Change password

### User Dashboard
- Submit transaction screenshots
- View transaction history with status
- View wallet balance
- View approved transactions
- Change password

### Transaction Workflow
1. User uploads screenshot of payment and amount
2. Admin reviews the screenshot in Admin Dashboard
3. Admin approves or rejects the transaction
4. If approved, money is added to user's wallet
5. User sees "Approved" status in their history

## API Routes

All API routes are in `/app/api/`:
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `DELETE /api/users/:userId` - Delete user (admin only)
- `POST /api/users/:userId` - Add money to wallet (admin only)
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/:id` - Approve/reject transaction (admin only)

## Database Schema

### Users Collection
\`\`\`javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "admin" | "user",
  walletBalance: Number,
  createdAt: Date
}
\`\`\`

### Transactions Collection
\`\`\`javascript
{
  userId: ObjectId,
  userName: String,
  amount: Number,
  description: String,
  status: "pending" | "approved" | "rejected",
  screenshotImage: String (base64),
  approvedBy: ObjectId,
  approvedAt: Date,
  createdAt: Date
}
\`\`\`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env.local`
- For MongoDB Atlas, whitelist your IP address

### User Creation Fails
- Ensure MongoDB is running
- Check email is not already in use
- Verify all required fields are provided

### Login Not Working
- Clear browser cache and localStorage
- Check MongoDB connection
- Verify email and password are correct

## Production Deployment

1. Change `MONGODB_URI` to production database
2. Generate a strong `JWT_SECRET`
3. Set `NODE_ENV=production`
4. Run `npm run build` then `npm run start`
5. Deploy to Vercel or your preferred hosting

## Development Notes

- Images are stored as Base64 strings in MongoDB
- JWT tokens expire after 7 days
- Admin access is required for user management and approvals
- All transactions start as "pending" until approved by admin
