# Personal Finance Dashboard

A comprehensive, full-stack personal finance management application built with Node.js, Express, MongoDB, and vanilla JavaScript. Track expenses, manage budgets, set financial goals, and get insights into your financial health.

## 🚀 Features

### 💰 Expense & Income Tracking
- Add, edit, and categorize transactions
- Support for recurring transactions
- Receipt upload and attachment
- Multiple payment methods
- Advanced filtering and search

### 📊 Budget Management
- Create monthly/yearly budgets
- Category-wise budget allocation
- Real-time spending tracking
- Budget vs actual comparisons
- Rollover budget support

### 🧾 Bill Management
- Recurring bill reminders
- Payment tracking
- Vendor information management
- Overdue bill notifications
- Payment history

### 🎯 Financial Goals
- Savings goals with progress tracking
- Milestone achievements
- Auto-contribution setup
- Goal categories and priorities
- Progress visualization

### 📈 Analytics & Reports
- Interactive charts and graphs
- Spending patterns analysis
- Income vs expense trends
- Category-wise breakdowns
- Monthly/yearly summaries

### 🔐 Security & Authentication
- Secure user registration and login
- JWT token authentication
- Password encryption
- Protected API endpoints

### 🎨 Modern UI/UX
- Responsive design for all devices
- Dark/light theme support
- Interactive dashboards
- Real-time notifications
- Intuitive navigation

## � Quick Start Options

### 🌐 Production Deployment (Full Features)
**Deploy your own production-ready instance with full functionality:**

The application is ready for production deployment on modern cloud platforms:
- **Frontend**: Vercel (free tier available)
- **Backend**: Railway (free tier available)  
- **Database**: MongoDB Atlas (free tier available)

📖 **[Complete Production Deployment Guide →](PRODUCTION-DEPLOYMENT.md)**

### 💻 Local Development
**For development and customization:**

## �🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Express Validator** - Input validation

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **CSS Grid & Flexbox** - Layout
- **CSS Custom Properties** - Theming

## 📋 Prerequisites

## ⚡ Local Development Setup

### Prerequisites
Before running this application locally, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (v4.4 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/your-username/Personal-Finance-Dashboard.git
cd Personal-Finance-Dashboard

# 2. Install dependencies
npm run setup

# 3. Configure environment
cd backend
cp .env.example .env
# Edit .env with your settings

# 4. Start MongoDB (see MONGODB-SETUP-GUIDE.md)
net start MongoDB

# 5. Start the application
npm start
# Open frontend/index.html in your browser
```

## 🔒 Security Notice

**⚠️ IMPORTANT:** This repository follows security best practices:
- No real credentials are committed to the repository
- All sensitive data uses environment variables
- Examples use placeholder values only
- See `SECURITY.md` for detailed security guidelines

**Before deploying:** Always use your own secure credentials and never commit real secrets to version control.

## 🔒 Security

**⚠️ IMPORTANT**: 
- Never commit the `.env` file to version control
- Generate a secure JWT_SECRET using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Use environment variables for all sensitive data

## 🌐 Access Points
- **Frontend**: Open `frontend/index.html` in your browser
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
personal-finance-dashboard/
├── backend/                    # Server-side application
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── models/                # Database schemas
│   │   ├── User.js
│   │   ├── Transactions.js
│   │   ├── Budget.js
│   │   ├── Bill.js
│   │   └── Goal.js
│   ├── routes/                # API endpoints
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── bills.js
│   │   └── goals.js
│   ├── uploads/               # File storage
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
├── frontend/                  # Client-side application
│   ├── css/
│   │   └── style.css          # Responsive styling
│   ├── js/                    # Application modules
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── bills.js
│   │   ├── goals.js
│   │   └── charts.js
│   └── index.html             # Main application page
├── deployment/                # Deployment guides
├── .env.example               # Environment template
├── .gitignore
├── start.bat                  # Quick start script
├── package.json               # Project metadata
├── README.md                  # This file
├── MONGODB-SETUP-GUIDE.md     # Database setup help
└── LICENSE
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/finance_dashboard` |
| `JWT_SECRET` | JWT signing secret | *Required* |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Database Configuration

The application uses MongoDB with Mongoose ODM. The database will be automatically created when you start the application for the first time.

#### Collections Created:
- `users` - User accounts and preferences
- `transactions` - Income and expense records
- `budgets` - Budget planning and tracking
- `bills` - Recurring bill management
- `goals` - Financial goal tracking

## � Deployment

### GitHub Pages (Frontend Demo)
**Perfect for showcasing the interface:**

1. **Fork this repository**
2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
3. **Access your demo:**
   - URL: `https://your-username.github.io/Personal-Finance-Dashboard`
   - The demo runs with sample data (no backend required)

### Full Stack Deployment
**For production with real data:**

#### Frontend Options:
- **Netlify**: Connect your GitHub repo for automatic deployments
- **Vercel**: Connect your GitHub repo with zero configuration
- **GitHub Pages**: For demo/portfolio purposes

#### Backend Options:
- **Railway**: Connect GitHub repo, automatic MongoDB setup
- **Render**: Free tier with integrated database options  
- **Heroku**: Traditional platform with MongoDB Atlas
- **DigitalOcean**: App Platform with managed databases

See the `/deployment` folder for detailed deployment guides.

## �📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Transaction Endpoints
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get single transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary/overview` - Get transaction summary

### Budget Endpoints
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Create new budget
- `GET /api/budgets/current` - Get current month budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Bill Endpoints
- `GET /api/bills` - Get user bills
- `POST /api/bills` - Create new bill
- `GET /api/bills/upcoming` - Get upcoming bills
- `GET /api/bills/overdue` - Get overdue bills
- `POST /api/bills/:id/pay` - Mark bill as paid

### Goal Endpoints
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `POST /api/goals/:id/contribute` - Add contribution
- `POST /api/goals/:id/withdraw` - Add withdrawal
- `GET /api/goals/summary/overview` - Get goals summary

## 🎨 Customization

### Theme Configuration
The application supports light and dark themes. Themes can be customized by modifying CSS custom properties in `frontend/css/style.css`:

```css
:root {
    --primary-color: #3b82f6;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    /* ... more variables */
}
```

### Currency Support
The application supports multiple currencies:
- USD ($), EUR (€), GBP (£), JPY (¥)
- CAD (C$), AUD (A$), CHF (CHF)
- CNY (¥), INR (₹)

## 🚀 Deployment

### Production Environment Setup

1. **Environment Variables**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-very-secure-secret-key
FRONTEND_URL=https://your-domain.com
```

2. **Build for Production**
```bash
npm run build
```

3. **Start Production Server**
```bash
npm start
```

### Deployment Options

#### Heroku
1. Create a new Heroku app
2. Add MongoDB Atlas add-on
3. Set environment variables
4. Deploy using Git

#### DigitalOcean/AWS/GCP
1. Set up a VPS or container service
2. Install Node.js and MongoDB
3. Clone repository and install dependencies
4. Configure reverse proxy (Nginx)
5. Set up SSL certificate

#### Docker (Optional)
```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 5000
CMD ["node", "server.js"]
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Chart.js](https://www.chartjs.org/) for beautiful charts
- [Font Awesome](https://fontawesome.com/) for icons
- [MongoDB](https://www.mongodb.com/) for the database
- [Express.js](https://expressjs.com/) for the web framework

## 📞 Support

If you have any questions or need help with setup, please create an issue in the GitHub repository.

---

**Happy budgeting! 💰📊🎯**