const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    preferences: {
        theme: {
            type: String,
            default: 'dark',
            enum: ['light', 'dark']
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            bills: {
                type: Boolean,
                default: true
            },
            budgets: {
                type: Boolean,
                default: true
            }
        },
        dashboard: {
            showBalance: {
                type: Boolean,
                default: true
            },
            defaultView: {
                type: String,
                default: 'overview',
                enum: ['overview', 'transactions', 'budgets', 'bills', 'goals']
            }
        }
    },
    avatar: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

userSchema.index({ email: 1});
userSchema.index({ createdAt: -1});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password());
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

userSchema.methods.getPublicProfile = function() {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
};

userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase()});
};

userSchema.virtual('initials').get(function() {
    return this.name.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
});

userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
    }
});

module.exports - mongoose.model('User', userSchema);