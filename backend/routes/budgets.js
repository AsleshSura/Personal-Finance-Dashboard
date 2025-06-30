const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/budgets
// @desc    Get user's budgets
// @access  Private
router.get('/', auth, [
  query('year').optional().isInt({ min: 2020 }).withMessage('Year must be valid'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { year, month, isActive } = req.query;
    
    const filter = { user: req.user.userId };
    if (year) filter.year = parseInt(year);
    if (month) filter.month = parseInt(month);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const budgets = await Budget.find(filter)
      .sort({ year: -1, month: -1 })
      .populate('user', 'name email');

    res.json({
      success: true,
      data: budgets
    });

  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      error: 'Failed to fetch budgets'
    });
  }
});

// @route   GET /api/budgets/current
// @desc    Get current month's budget
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const budget = await Budget.getCurrentBudget(req.user.userId);
    
    if (!budget) {
      return res.json({
        success: true,
        data: null,
        message: 'No budget found for current month'
      });
    }

    // Update spent amounts
    await budget.updateSpentAmounts();

    res.json({
      success: true,
      data: budget
    });

  } catch (error) {
    console.error('Get current budget error:', error);
    res.status(500).json({
      error: 'Failed to fetch current budget'
    });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({
        error: 'Budget not found'
      });
    }

    // Update spent amounts
    await budget.updateSpentAmounts();

    res.json({
      success: true,
      data: budget
    });

  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      error: 'Failed to fetch budget'
    });
  }
});

// @route   POST /api/budgets
// @desc    Create new budget
// @access  Private
router.post('/', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Budget name must be between 1 and 100 characters'),
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020 })
    .withMessage('Year must be 2020 or later'),
  body('categories')
    .isArray({ min: 1 })
    .withMessage('Categories must be a non-empty array'),
  body('categories.*.category')
    .notEmpty()
    .withMessage('Category name is required'),
  body('categories.*.budgetAmount')
    .isFloat({ min: 0 })
    .withMessage('Budget amount must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if budget already exists for this month/year
    const existingBudget = await Budget.findOne({
      user: req.user.userId,
      month: req.body.month,
      year: req.body.year
    });

    if (existingBudget) {
      return res.status(400).json({
        error: 'Budget already exists',
        message: 'A budget already exists for this month and year'
      });
    }

    const budgetData = {
      ...req.body,
      user: req.user.userId
    };

    // Calculate total budget (will be done by pre-save middleware)
    const budget = new Budget(budgetData);
    await budget.save();

    // Update spent amounts
    await budget.updateSpentAmounts();

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budget
    });

  } catch (error) {
    console.error('Create budget error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Budget already exists for this month and year'
      });
    }
    res.status(500).json({
      error: 'Failed to create budget'
    });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Budget name must be between 1 and 100 characters'),
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Categories must be a non-empty array'),
  body('categories.*.budgetAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget amount must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({
        error: 'Budget not found'
      });
    }

    // Update fields
    const allowedUpdates = ['name', 'categories', 'notes', 'isActive'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        budget[field] = req.body[field];
      }
    });

    await budget.save();

    // Update spent amounts
    await budget.updateSpentAmounts();

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });

  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      error: 'Failed to update budget'
    });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({
        error: 'Budget not found'
      });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      error: 'Failed to delete budget'
    });
  }
});

// @route   POST /api/budgets/:id/copy
// @desc    Copy budget to another month/year
// @access  Private
router.post('/:id/copy', auth, [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020 })
    .withMessage('Year must be 2020 or later')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const sourceBudget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!sourceBudget) {
      return res.status(404).json({
        error: 'Source budget not found'
      });
    }

    // Check if budget already exists for target month/year
    const existingBudget = await Budget.findOne({
      user: req.user.userId,
      month: req.body.month,
      year: req.body.year
    });

    if (existingBudget) {
      return res.status(400).json({
        error: 'Budget already exists for target month and year'
      });
    }

    // Create new budget with copied data
    const newBudgetData = {
      user: req.user.userId,
      name: req.body.name || sourceBudget.name,
      month: req.body.month,
      year: req.body.year,
      categories: sourceBudget.categories.map(cat => ({
        category: cat.category,
        budgetAmount: cat.budgetAmount,
        spentAmount: 0,
        rollover: cat.rollover
      })),
      notes: sourceBudget.notes
    };

    const newBudget = new Budget(newBudgetData);
    await newBudget.save();

    res.status(201).json({
      success: true,
      message: 'Budget copied successfully',
      data: newBudget
    });

  } catch (error) {
    console.error('Copy budget error:', error);
    res.status(500).json({
      error: 'Failed to copy budget'
    });
  }
});

// @route   GET /api/budgets/summary/:year
// @desc    Get budget summary for a year
// @access  Private
router.get('/summary/:year', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (year < 2020) {
      return res.status(400).json({
        error: 'Year must be 2020 or later'
      });
    }

    const summary = await Budget.getBudgetSummary(req.user.userId, year);

    res.json({
      success: true,
      data: summary[0] || {
        totalBudgeted: 0,
        totalSpent: 0,
        avgMonthlyBudget: 0,
        avgMonthlySpent: 0,
        monthsWithBudget: 0
      }
    });

  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch budget summary'
    });
  }
});

// @route   PUT /api/budgets/:id/refresh
// @desc    Refresh budget spent amounts
// @access  Private
router.put('/:id/refresh', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({
        error: 'Budget not found'
      });
    }

    await budget.updateSpentAmounts();

    res.json({
      success: true,
      message: 'Budget refreshed successfully',
      data: budget
    });

  } catch (error) {
    console.error('Refresh budget error:', error);
    res.status(500).json({
      error: 'Failed to refresh budget'
    });
  }
});

module.exports = router;
