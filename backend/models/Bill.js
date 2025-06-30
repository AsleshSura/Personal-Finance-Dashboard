const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Bill name is required'],
    trim: true,
    maxlength: [100, 'Bill name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'housing', 'utilities', 'insurance', 'healthcare', 'subscriptions',
      'transportation', 'education', 'debt', 'taxes', 'other-expense'
    ]
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annually', 'annually', 'one-time'],
    default: 'monthly'
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.dueDate;
      },
      message: 'End date must be after due date'
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit-card', 'debit-card', 'bank-transfer', 'check', 'digital-wallet', 'auto-pay', 'other'],
    default: 'auto-pay'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidDate: {
    type: Date
  },
  paidAmount: {
    type: Number,
    min: [0, 'Paid amount cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    daysBefore: {
      type: Number,
      default: 3,
      min: [0, 'Days before cannot be negative'],
      max: [30, 'Days before cannot exceed 30']
    },
    lastReminderSent: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  vendor: {
    name: String,
    website: String,
    phone: String,
    email: String,
    address: String
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  paymentHistory: [{
    amount: Number,
    paidDate: Date,
    paymentMethod: String,
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes
billSchema.index({ user: 1, nextDueDate: 1 });
billSchema.index({ user: 1, isActive: 1 });
billSchema.index({ user: 1, category: 1 });
billSchema.index({ user: 1, frequency: 1 });

// Virtual for overdue status
billSchema.virtual('isOverdue').get(function() {
  return this.nextDueDate < new Date() && !this.isPaid && this.isActive;
});

// Virtual for days until due
billSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const timeDiff = this.nextDueDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for status
billSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.isPaid) return 'paid';
  if (this.isOverdue) return 'overdue';
  if (this.daysUntilDue <= 3) return 'due-soon';
  return 'pending';
});

// Method to calculate next due date
billSchema.methods.calculateNextDueDate = function() {
  const currentDue = new Date(this.nextDueDate);
  
  switch (this.frequency) {
    case 'weekly':
      currentDue.setDate(currentDue.getDate() + 7);
      break;
    case 'bi-weekly':
      currentDue.setDate(currentDue.getDate() + 14);
      break;
    case 'monthly':
      currentDue.setMonth(currentDue.getMonth() + 1);
      break;
    case 'quarterly':
      currentDue.setMonth(currentDue.getMonth() + 3);
      break;
    case 'semi-annually':
      currentDue.setMonth(currentDue.getMonth() + 6);
      break;
    case 'annually':
      currentDue.setFullYear(currentDue.getFullYear() + 1);
      break;
    case 'one-time':
      // One-time bills don't have next due date
      return null;
  }
  
  // Check if end date is set and next due date exceeds it
  if (this.endDate && currentDue > this.endDate) {
    return null;
  }
  
  return currentDue;
};

// Method to mark as paid
billSchema.methods.markAsPaid = function(amount, paymentMethod, transactionId, notes) {
  this.isPaid = true;
  this.paidDate = new Date();
  this.paidAmount = amount || this.amount;
  
  // Add to payment history
  this.paymentHistory.push({
    amount: this.paidAmount,
    paidDate: this.paidDate,
    paymentMethod: paymentMethod || this.paymentMethod,
    transactionId: transactionId,
    notes: notes
  });
  
  // Calculate next due date
  const nextDue = this.calculateNextDueDate();
  if (nextDue) {
    this.nextDueDate = nextDue;
    this.isPaid = false; // Reset for next period
    this.paidDate = null;
    this.paidAmount = null;
  } else {
    // One-time bill or reached end date
    this.isActive = false;
  }
  
  return this.save();
};

// Static method to get upcoming bills
billSchema.statics.getUpcomingBills = function(userId, days = 30) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    user: userId,
    isActive: true,
    isPaid: false,
    nextDueDate: { $lte: endDate }
  }).sort({ nextDueDate: 1 });
};

// Static method to get overdue bills
billSchema.statics.getOverdueBills = function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    isPaid: false,
    nextDueDate: { $lt: new Date() }
  }).sort({ nextDueDate: 1 });
};

// Static method to get bills summary
billSchema.statics.getBillsSummary = function(userId) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalBills: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        paidBills: {
          $sum: {
            $cond: ['$isPaid', 1, 0]
          }
        },
        overdueBills: {
          $sum: {
            $cond: [
              { $lt: ['$nextDueDate', new Date()] },
              1,
              0
            ]
          }
        },
        avgBillAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Pre-save middleware to set next due date
billSchema.pre('save', function(next) {
  if (this.isNew && !this.nextDueDate) {
    this.nextDueDate = this.dueDate;
  }
  next();
});

// Ensure virtual fields are serialized
billSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Bill', billSchema);
