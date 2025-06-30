const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later']
  },
  categories: [{
    category: {
      type: String,
      required: true,
      enum: [
        'food', 'transportation', 'housing', 'utilities', 'healthcare', 
        'entertainment', 'shopping', 'education', 'insurance', 'debt', 
        'savings', 'investment-expense', 'travel', 'personal-care', 
        'subscriptions', 'taxes', 'other-expense'
      ]
    },
    budgetAmount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget amount cannot be negative']
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative']
    },
    rollover: {
      type: Boolean,
      default: false
    }
  }],
  totalBudget: {
    type: Number,
    required: true,
    min: [0, 'Total budget cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index to ensure one budget per user per month/year
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

// Index for querying active budgets
budgetSchema.index({ user: 1, isActive: 1 });

// Virtual for budget period
budgetSchema.virtual('period').get(function() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[this.month - 1]} ${this.year}`;
});

// Virtual for budget status
budgetSchema.virtual('status').get(function() {
  const percentage = (this.totalSpent / this.totalBudget) * 100;
  if (percentage >= 100) return 'over-budget';
  if (percentage >= 80) return 'warning';
  if (percentage >= 50) return 'on-track';
  return 'under-budget';
});

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.totalBudget - this.totalSpent);
});

// Virtual for overspent amount
budgetSchema.virtual('overspentAmount').get(function() {
  return Math.max(0, this.totalSpent - this.totalBudget);
});

// Method to update spent amounts
budgetSchema.methods.updateSpentAmounts = async function() {
  const Transaction = mongoose.model('Transaction');
  
  const startDate = new Date(this.year, this.month - 1, 1);
  const endDate = new Date(this.year, this.month, 0, 23, 59, 59);
  
  // Get spending by category for this period
  const spending = await Transaction.aggregate([
    {
      $match: {
        user: this.user,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  // Update spent amounts for each category
  let totalSpent = 0;
  
  this.categories.forEach(budgetCategory => {
    const spendingData = spending.find(s => s._id === budgetCategory.category);
    budgetCategory.spentAmount = spendingData ? spendingData.total : 0;
    totalSpent += budgetCategory.spentAmount;
  });
  
  this.totalSpent = totalSpent;
  
  return this.save();
};

// Static method to get current budget for user
budgetSchema.statics.getCurrentBudget = function(userId) {
  const now = new Date();
  return this.findOne({
    user: userId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    isActive: true
  });
};

// Static method to get budget summary
budgetSchema.statics.getBudgetSummary = function(userId, year) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        year: year,
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalBudgeted: { $sum: '$totalBudget' },
        totalSpent: { $sum: '$totalSpent' },
        avgMonthlyBudget: { $avg: '$totalBudget' },
        avgMonthlySpent: { $avg: '$totalSpent' },
        monthsWithBudget: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware to calculate total budget
budgetSchema.pre('save', function(next) {
  if (this.categories && this.categories.length > 0) {
    this.totalBudget = this.categories.reduce((total, cat) => total + cat.budgetAmount, 0);
  }
  next();
});

// Ensure virtual fields are serialized
budgetSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Budget', budgetSchema);