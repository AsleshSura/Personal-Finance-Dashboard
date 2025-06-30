const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: [100, 'Goal name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Goal type is required'],
    enum: ['savings', 'debt-payoff', 'investment', 'emergency-fund', 'purchase', 'vacation', 'retirement', 'education', 'other'],
    default: 'savings'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0.01, 'Target amount must be greater than 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Target date must be in the future'
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  category: {
    type: String,
    enum: [
      'emergency', 'vacation', 'home', 'car', 'education', 'retirement',
      'investment', 'debt-reduction', 'healthcare', 'wedding', 'baby',
      'business', 'charity', 'technology', 'other'
    ],
    default: 'other'
  },
  autoContribute: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      min: [0, 'Auto-contribute amount cannot be negative']
    },
    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    nextContribution: Date
  },
  milestones: [{
    name: {
      type: String,
      required: true,
      maxlength: [50, 'Milestone name cannot exceed 50 characters']
    },
    targetAmount: {
      type: Number,
      required: true,
      min: [0, 'Milestone target amount cannot be negative']
    },
    achievedDate: Date,
    isAchieved: {
      type: Boolean,
      default: false
    },
    reward: {
      type: String,
      maxlength: [100, 'Reward description cannot exceed 100 characters']
    }
  }],
  contributions: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Contribution amount must be greater than 0']
    },
    date: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['manual', 'auto', 'bonus', 'transfer', 'other'],
      default: 'manual'
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  withdrawals: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Withdrawal amount must be greater than 0']
    },
    date: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true,
      maxlength: [100, 'Reason cannot exceed 100 characters']
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, type: 1 });
goalSchema.index({ user: 1, targetDate: 1 });
goalSchema.index({ user: 1, priority: 1 });
goalSchema.index({ user: 1, isArchived: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const timeDiff = this.targetDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for required monthly contribution
goalSchema.virtual('requiredMonthlyContribution').get(function() {
  const monthsRemaining = Math.max(1, this.daysRemaining / 30);
  return this.remainingAmount / monthsRemaining;
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  return this.targetDate < new Date() && this.status === 'active' && this.progressPercentage < 100;
});

// Virtual for completion status
goalSchema.virtual('isCompleted').get(function() {
  return this.currentAmount >= this.targetAmount;
});

// Method to add contribution
goalSchema.methods.addContribution = function(amount, source = 'manual', transactionId = null, notes = '') {
  this.contributions.push({
    amount,
    source,
    transactionId,
    notes
  });
  
  this.currentAmount += amount;
  
  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  // Check and update milestones
  this.milestones.forEach(milestone => {
    if (!milestone.isAchieved && this.currentAmount >= milestone.targetAmount) {
      milestone.isAchieved = true;
      milestone.achievedDate = new Date();
    }
  });
  
  return this.save();
};

// Method to add withdrawal
goalSchema.methods.addWithdrawal = function(amount, reason, transactionId = null) {
  if (amount > this.currentAmount) {
    throw new Error('Withdrawal amount cannot exceed current amount');
  }
  
  this.withdrawals.push({
    amount,
    reason,
    transactionId
  });
  
  this.currentAmount -= amount;
  
  // Reset completion status if amount falls below target
  if (this.currentAmount < this.targetAmount && this.status === 'completed') {
    this.status = 'active';
  }
  
  // Reset milestones if necessary
  this.milestones.forEach(milestone => {
    if (milestone.isAchieved && this.currentAmount < milestone.targetAmount) {
      milestone.isAchieved = false;
      milestone.achievedDate = null;
    }
  });
  
  return this.save();
};

// Method to calculate progress velocity (amount per day)
goalSchema.methods.getProgressVelocity = function() {
  if (this.contributions.length === 0) return 0;
  
  const totalContributions = this.contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
  const daysActive = Math.max(1, (new Date() - this.startDate) / (1000 * 60 * 60 * 24));
  
  return totalContributions / daysActive;
};

// Method to get projected completion date
goalSchema.methods.getProjectedCompletionDate = function() {
  const velocity = this.getProgressVelocity();
  if (velocity <= 0) return null;
  
  const daysToCompletion = this.remainingAmount / velocity;
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysToCompletion);
  
  return completionDate;
};

// Static method to get goals summary
goalSchema.statics.getGoalsSummary = function(userId) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        isArchived: false
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTarget: { $sum: '$targetAmount' },
        totalCurrent: { $sum: '$currentAmount' }
      }
    }
  ]);
};

// Static method to get goals by priority
goalSchema.statics.getGoalsByPriority = function(userId, priority) {
  return this.find({
    user: userId,
    priority: priority,
    status: 'active',
    isArchived: false
  }).sort({ targetDate: 1 });
};

// Static method to get overdue goals
goalSchema.statics.getOverdueGoals = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    targetDate: { $lt: new Date() },
    isArchived: false,
    $expr: { $lt: ['$currentAmount', '$targetAmount'] }
  }).sort({ targetDate: 1 });
};

// Pre-save middleware to calculate auto-contribution schedule
goalSchema.pre('save', function(next) {
  if (this.autoContribute.enabled && !this.autoContribute.nextContribution) {
    const nextDate = new Date();
    switch (this.autoContribute.frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
    }
    this.autoContribute.nextContribution = nextDate;
  }
  
  next();
});

// Ensure virtual fields are serialized
goalSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Goal', goalSchema);
