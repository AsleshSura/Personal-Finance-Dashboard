const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Bill = require('../models/Bill');
const Transaction = require('../models/Transactions');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/bills/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bill-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|gif|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('document');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files, PDF files, and documents are allowed'));
    }
  }
});

// @route   GET /api/bills
// @desc    Get user's bills
// @access  Private
router.get('/', auth, [
  query('status').optional().isIn(['active', 'inactive', 'paid', 'overdue', 'due-soon', 'pending']).withMessage('Invalid status'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('frequency').optional().isIn(['weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annually', 'annually', 'one-time']).withMessage('Invalid frequency'),
  query('upcoming').optional().isInt({ min: 1, max: 365 }).withMessage('Upcoming days must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status, category, frequency, upcoming } = req.query;
    
    let filter = { user: req.user.userId };
    
    if (category) filter.category = category;
    if (frequency) filter.frequency = frequency;
    
    // Handle status filtering
    if (status) {
      switch (status) {
        case 'active':
          filter.isActive = true;
          break;
        case 'inactive':
          filter.isActive = false;
          break;
        case 'paid':
          filter.isPaid = true;
          break;
        case 'overdue':
          filter.isActive = true;
          filter.isPaid = false;
          filter.nextDueDate = { $lt: new Date() };
          break;
        case 'due-soon':
          const soonDate = new Date();
          soonDate.setDate(soonDate.getDate() + 3);
          filter.isActive = true;
          filter.isPaid = false;
          filter.nextDueDate = { $lte: soonDate };
          break;
        case 'pending':
          filter.isActive = true;
          filter.isPaid = false;
          break;
      }
    }

    // Handle upcoming filter
    if (upcoming) {
      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + parseInt(upcoming));
      filter.nextDueDate = { $lte: upcomingDate };
      filter.isActive = true;
      filter.isPaid = false;
    }

    const bills = await Bill.find(filter)
      .sort({ nextDueDate: 1 })
      .populate('user', 'name email');

    res.json({
      success: true,
      data: bills
    });

  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      error: 'Failed to fetch bills'
    });
  }
});

// @route   GET /api/bills/upcoming
// @desc    Get upcoming bills
// @access  Private
router.get('/upcoming', auth, [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const days = req.query.days ? parseInt(req.query.days) : 30;
    const bills = await Bill.getUpcomingBills(req.user.userId, days);

    res.json({
      success: true,
      data: bills
    });

  } catch (error) {
    console.error('Get upcoming bills error:', error);
    res.status(500).json({
      error: 'Failed to fetch upcoming bills'
    });
  }
});

// @route   GET /api/bills/overdue
// @desc    Get overdue bills
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    const bills = await Bill.getOverdueBills(req.user.userId);

    res.json({
      success: true,
      data: bills
    });

  } catch (error) {
    console.error('Get overdue bills error:', error);
    res.status(500).json({
      error: 'Failed to fetch overdue bills'
    });
  }
});

// @route   GET /api/bills/:id
// @desc    Get single bill
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill
    });

  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      error: 'Failed to fetch bill'
    });
  }
});

// @route   POST /api/bills
// @desc    Create new bill
// @access  Private
router.post('/', auth, upload.array('attachments', 5), [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Bill name must be between 1 and 100 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be valid'),
  body('frequency')
    .isIn(['weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annually', 'annually', 'one-time'])
    .withMessage('Invalid frequency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const billData = {
      ...req.body,
      user: req.user.userId,
      amount: parseFloat(req.body.amount)
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      billData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/bills/${file.filename}`
      }));
    }

    // Handle tags
    if (req.body.tags) {
      billData.tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    // Handle vendor info
    if (req.body.vendor) {
      billData.vendor = typeof req.body.vendor === 'string' 
        ? JSON.parse(req.body.vendor) 
        : req.body.vendor;
    }

    // Handle reminders
    if (req.body.reminders) {
      billData.reminders = typeof req.body.reminders === 'string' 
        ? JSON.parse(req.body.reminders) 
        : req.body.reminders;
    }

    const bill = new Bill(billData);
    await bill.save();

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });

  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      error: 'Failed to create bill'
    });
  }
});

// @route   PUT /api/bills/:id
// @desc    Update bill
// @access  Private
router.put('/:id', auth, upload.array('attachments', 5), [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Bill name must be between 1 and 100 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'attachments') {
        bill[key] = req.body[key];
      }
    });

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/bills/${file.filename}`
      }));
      bill.attachments = bill.attachments.concat(newAttachments);
    }

    // Handle tags
    if (req.body.tags) {
      bill.tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    await bill.save();

    res.json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });

  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      error: 'Failed to update bill'
    });
  }
});

// @route   DELETE /api/bills/:id
// @desc    Delete bill
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found'
      });
    }

    await Bill.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });

  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      error: 'Failed to delete bill'
    });
  }
});

// @route   POST /api/bills/:id/pay
// @desc    Mark bill as paid
// @access  Private
router.post('/:id/pay', auth, [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit-card', 'debit-card', 'bank-transfer', 'check', 'digital-wallet', 'auto-pay', 'other'])
    .withMessage('Invalid payment method'),
  body('createTransaction')
    .optional()
    .isBoolean()
    .withMessage('createTransaction must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found'
      });
    }

    const { amount, paymentMethod, notes, createTransaction = true } = req.body;
    let transactionId = null;

    // Create transaction if requested
    if (createTransaction) {
      const transaction = new Transaction({
        user: req.user.userId,
        type: 'expense',
        amount: amount || bill.amount,
        description: `Bill payment: ${bill.name}`,
        category: bill.category,
        paymentMethod: paymentMethod || bill.paymentMethod,
        notes: notes || `Payment for bill: ${bill.name}`,
        tags: ['bill-payment', ...bill.tags]
      });
      
      await transaction.save();
      transactionId = transaction._id;
    }

    // Mark bill as paid
    await bill.markAsPaid(amount, paymentMethod, transactionId, notes);

    res.json({
      success: true,
      message: 'Bill marked as paid successfully',
      data: {
        bill,
        transactionCreated: !!transactionId,
        transactionId
      }
    });

  } catch (error) {
    console.error('Pay bill error:', error);
    res.status(500).json({
      error: 'Failed to mark bill as paid'
    });
  }
});

// @route   GET /api/bills/summary/overview
// @desc    Get bills summary
// @access  Private
router.get('/summary/overview', auth, async (req, res) => {
  try {
    const summary = await Bill.getBillsSummary(req.user.userId);
    
    res.json({
      success: true,
      data: summary[0] || {
        totalBills: 0,
        totalAmount: 0,
        paidBills: 0,
        overdueBills: 0,
        avgBillAmount: 0
      }
    });

  } catch (error) {
    console.error('Get bills summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch bills summary'
    });
  }
});

// @route   DELETE /api/bills/:billId/attachments/:attachmentId
// @desc    Delete bill attachment
// @access  Private
router.delete('/:billId/attachments/:attachmentId', auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.billId,
      user: req.user.userId
    });

    if (!bill) {
      return res.status(404).json({
        error: 'Bill not found'
      });
    }

    const attachment = bill.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({
        error: 'Attachment not found'
      });
    }

    attachment.remove();
    await bill.save();

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      error: 'Failed to delete attachment'
    });
  }
});

module.exports = router;
