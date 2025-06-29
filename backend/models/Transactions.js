const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: ['income', 'expense'],
        lowercase: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
        validate: {
            validator: function(value) {
                return value > 0 && Number.isFinite(value);
            },
            message: 'Amount must be a positive number'
        }
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [1, 'Description cannot be empty'],
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        enum: {
            values: [
                //Income
                'salary', 'freelance', 'business', 'investment', 'rental', 'bonus', 'gift', 'other-income',
                //Expense
                'food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment',
                'shopping', 'education', 'insurance', 'debt', 'savings', 'investment-expense',
                'travel', 'person-care', 'subscriptions', 'taxes', 'other-expenses'
            ],
            message: 'Invalid category'
        }
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now,
        validate: {
            validator: function(value) {
                return value <= new Date();
            },
            message: 'Transaction date cannot be in the future'
        }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'credit-card', 'debit-card', 'bank-transfer', 'check', 'digital-wallet', 'other'],
        default: 'cash'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }],
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    receipt: {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String
    },
    location: {
        name: String,
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    recurring: {
        isRecurring: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'],
            required: function() {
                return this.recurring && this.recurring.isRecurring;
            }
        },
        endDate: {
            type: Date,
            validate: {
                validator: function(value) {
                    return !this.recurring?.isRecurring || (value && value > this.date);
                },
                message: 'End date must be after transaction date'
            }
        },
        nextDue: Date
    },
    budget: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Budget'
    },
    isDeleted: {
        type: String,
        index: true
    }
}, {
    timestamps: true
});

transactionSchema.index({ user:1, date: -1});
transactionSchema.index({ user:1, type: 1});
transactionSchema.index({ user:1, category: 1});
transactionSchema.index({ user:1, date: -1, type: 1});
transactionSchema.index({ importBatch: 1});

transactionSchema.virtual('formattedAmount').get(function(){
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(this.amount);
});

transactionSchema.statics.getByDateRange = function(userId, startDate, endDate) {
    return this.find({
        user: userId,
        date: {
            $gte: startDate,
            $lte: endDate
        },
        isDeleted: false
    }).sort({ date: -1});
};

transactionSchema.statics.getCategorySummary = function(userId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate, $lte: endDate},
                isDeleted: false
            }
        },
        {
            $group: {
                _id: {
                    category: '$category',
                    type: '$type'
                },
                total: { $sum: '$amount'},
                count: { $sum: 1},
                avgAmount: {$avg: 'amount'}
            }
        },
        {
            $sort: { total: -1}
        }
    ]);
};

transactionSchema.statics.getMonthlySummary = function(userId, year) {
    return this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: {
                    $gte: new Date(year, 0, 1),
                    $lt: new Date(year+1, 0,1)
                },
                isDeleted: false
            }
        },
        {
            $group: {
                _id: {
                    month: {$month: '$date'},
                    type: '$type'
                },
                total: { $sum: '$amount'},
                count: { $sum: 1}
            }
        },
        {
            $sort: {'_id.month': 1}
        }
    ]);
};

transactionSchema.methods.softDelete = function() {
    this.isDeleted = true;
    return this.save();
};

transactionSchema.pre('save', function(next){
    if (this.recurring && this.recurring.isRecurring && !this.recurring.nextDue) {
        const nextDate = new Date(this.date);
        switch (this.recurring.frequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
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
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }
        this.recurring.nextDue = nextDate;
    }

    next();
});

transactionSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Transaction', transactionSchema);