const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transactions');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) and PDF files are allowed'));
    }
  }
});

// @route   GET /api/transactions
// @desc    Get user's transactions with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      type,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {
      user: req.user.userId,
      isDeleted: false
    };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('budget', 'name period'),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.userId
    }).populate('budget', 'name period');

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', auth, upload.single('receipt'), [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be valid'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit-card', 'debit-card', 'bank-transfer', 'check', 'digital-wallet', 'other'])
    .withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const transactionData = {
      ...req.body,
      user: req.user.userId,
      amount: parseFloat(req.body.amount)
    };

    // Handle file upload
    if (req.file) {
      transactionData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/receipts/${req.file.filename}`
      };
    }

    // Handle tags
    if (req.body.tags) {
      transactionData.tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    const transaction = new Transaction(transactionData);
    await transaction.save();

    // Update related budget if expense
    if (transaction.type === 'expense') {
      const budget = await Budget.getCurrentBudget(req.user.userId);
      if (budget) {
        await budget.updateSpentAmounts();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      error: 'Failed to create transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, upload.single('receipt'), [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        transaction[key] = req.body[key];
      }
    });

    // Handle file upload
    if (req.file) {
      transaction.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/receipts/${req.file.filename}`
      };
    }

    // Handle tags
    if (req.body.tags) {
      transaction.tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    await transaction.save();

    // Update related budget if expense
    if (transaction.type === 'expense') {
      const budget = await Budget.getCurrentBudget(req.user.userId);
      if (budget) {
        await budget.updateSpentAmounts();
      }
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      error: 'Failed to update transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete (soft delete) transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    await transaction.softDelete();

    // Update related budget if expense
    if (transaction.type === 'expense') {
      const budget = await Budget.getCurrentBudget(req.user.userId);
      if (budget) {
        await budget.updateSpentAmounts();
      }
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      error: 'Failed to delete transaction'
    });
  }
});

// @route   GET /api/transactions/summary/overview
// @desc    Get transaction overview/summary
// @access  Private
router.get('/summary/overview', auth, [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const [summary, categoryData] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user.userId),
            date: { $gte: start, $lte: end },
            isDeleted: false
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]),
      Transaction.getCategorySummary(req.user.userId, start, end)
    ]);

    const result = {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      transactionCount: 0,
      categoryBreakdown: categoryData
    };

    summary.forEach(item => {
      if (item._id === 'income') {
        result.totalIncome = item.total;
      } else if (item._id === 'expense') {
        result.totalExpense = item.total;
      }
      result.transactionCount += item.count;
    });

    result.netAmount = result.totalIncome - result.totalExpense;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction summary'
    });
  }
});

// @route   GET /api/transactions/summary/monthly
// @desc    Get monthly transaction summary
// @access  Private
router.get('/summary/monthly', auth, [
  query('year').optional().isInt({ min: 2020 }).withMessage('Year must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    
    const monthlyData = await Transaction.getMonthlySummary(req.user.userId, year);

    res.json({
      success: true,
      data: monthlyData
    });

  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch monthly summary'
    });
  }
});

module.exports = router;
