# 💰 Personal Finance Dashboard

A full-stack web application for managing personal finances with user authentication, transaction tracking, budgeting, and financial goal management.

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- MongoDB installed and running (see MongoDB Setup below)

### Installation
```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Configure environment
# Copy .env.example to .env and update settings
cp .env.example .env

# 3. Start the backend server
npm start

# 4. Open frontend/index.html in your browser
```

## �️ MongoDB Setup

**Option 1: Local MongoDB**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and run as Windows Service
3. Default connection: `mongodb://127.0.0.1:27017/finance-dashboard`

**Option 2: MongoDB Atlas (Cloud)**
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster and get connection string
3. Update `MONGODB_URI` in your `.env` file

## � Project Structure

```
Personal-Finance-Dashboard/
├── frontend/                 # Client-side application
│   ├── index.html           # Main application page
│   ├── css/style.css        # Styling
│   └── js/                  # JavaScript modules
├── backend/                 # Server-side API
│   ├── server.js            # Main server file
│   ├── models/              # Database schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Authentication & utilities
│   └── package.json         # Dependencies
└── README.md               # This file
```

## � Configuration

Create a `.env` file in the `backend/` directory:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MONGODB_URI=mongodb://127.0.0.1:27017/finance-dashboard
PORT=5000
```

## 🌟 Features

- **User Authentication**: Secure registration and login
- **Transaction Management**: Track income and expenses
- **Budget Planning**: Set and monitor budgets
- **Bill Tracking**: Manage recurring bills
- **Financial Goals**: Set and track financial objectives
- **Data Visualization**: Charts and graphs for insights

## 🛠️ Technologies Used

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Chart.js for data visualization

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## 📝 License

MIT License - see LICENSE file for details.
