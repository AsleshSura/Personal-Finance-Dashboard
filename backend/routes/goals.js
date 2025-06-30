const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transactions');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/goals
// @desc    Get user's goals
// @access  Private
router.get('/', auth, [
  query('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']).withMessage('Invalid status'),
  query('type').optional().isIn(['savings', 'debt-payoff', 'investment', 'emergency-fund', 'purchase', 'vacation', 'retirement', 'education', 'other']).withMessage('Invalid type'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  query('category').optional().isString().withMessage('Category must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status, type, priority, category, sortBy = 'targetDate', sortOrder = 'asc' } = req.query;
    
    const filter = { 
      user: req.user.userId,
      isArchived: false
    };
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const goals = await Goal.find(filter)
      .sort(sort)
      .populate('user', 'name email');

    res.json({
      success: true,
      data: goals
    });

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      error: 'Failed to fetch goals'
    });
  }
});

// @route   GET /api/goals/overdue
// @desc    Get overdue goals
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    const goals = await Goal.getOverdueGoals(req.user.userId);

    res.json({
      success: true,
      data: goals
    });

  } catch (error) {
    console.error('Get overdue goals error:', error);
    res.status(500).json({
      error: 'Failed to fetch overdue goals'
    });
  }
});

// @route   GET /api/goals/priority/:priority
// @desc    Get goals by priority
// @access  Private
router.get('/priority/:priority', auth, async (req, res) => {
  try {
    const { priority } = req.params;
    
    if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({
        error: 'Invalid priority level'
      });
    }

    const goals = await Goal.getGoalsByPriority(req.user.userId, priority);

    res.json({
      success: true,
      data: goals
    });

  } catch (error) {
    console.error('Get goals by priority error:', error);
    res.status(500).json({
      error: 'Failed to fetch goals by priority'
    });
  }
});

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found'
      });
    }

    res.json({
      success: true,
      data: goal
    });

  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      error: 'Failed to fetch goal'
    });
  }
});

// @route   POST /api/goals
// @desc    Create new goal
// @access  Private
router.post('/', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Goal name must be between 1 and 100 characters'),
  body('targetAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0'),
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be valid')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
  body('type')
    .isIn(['savings', 'debt-payoff', 'investment', 'emergency-fund', 'purchase', 'vacation', 'retirement', 'education', 'other'])
    .withMessage('Invalid goal type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const goalData = {
      ...req.body,
      user: req.user.userId,
      targetAmount: parseFloat(req.body.targetAmount),
      currentAmount: req.body.currentAmount ? parseFloat(req.body.currentAmount) : 0
    };

    // Handle tags
    if (req.body.tags) {
      goalData.tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    // Handle milestones
    if (req.body.milestones && Array.isArray(req.body.milestones)) {
      goalData.milestones = req.body.milestones.map(milestone => ({
        ...milestone,
        targetAmount: parseFloat(milestone.targetAmount)
      }));
    }

    const goal = new Goal(goalData);
    await goal.save();

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal
    });

  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      error: 'Failed to create goal'
    });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Goal name must be between 1 and 100 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be valid'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'paused', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found'
      });
    }

    // Update fields
    const allowedUpdates = [
      'name', 'description', 'targetAmount', 'targetDate', 'priority', 
      'status', 'category', 'notes', 'tags', 'milestones', 'autoContribute'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        goal[field] = req.body[field];
      }
    });

    // Handle numeric fields
    if (req.body.targetAmount) {
      goal.targetAmount = parseFloat(req.body.targetAmount);
    }

    await goal.save();

    res.json({
      success: true,
      message: 'Goal updated successfully',
      data: goal
    });

  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      error: 'Failed to update goal'
    });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete goal (archive)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found'
      });
    }

    // Archive instead of delete
    goal.isArchived = true;
    await goal.save();

    res.json({
      success: true,
      message: 'Goal archived successfully'
    });

  } catch (error) {
    console.error('Archive goal error:', error);
    res.status(500).json({
      error: 'Failed to archive goal'
    });
  }
});

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to goal
// @access  Private
router.post('/:id/contribute', auth, [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Contribution amount must be greater than 0'),
  body('source')
    .optional()
    .isIn(['manual', 'auto', 'bonus', 'transfer', 'other'])
    .withMessage('Invalid contribution source'),
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

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found'
      });
    }

    const { amount, source = 'manual', notes, createTransaction = true } = req.body;
    let transactionId = null;

    // Create transaction if requested
    if (createTransaction) {
      const transaction = new Transaction({
        user: req.user.userId,
        type: 'expense',
        amount: parseFloat(amount),
        description: `Goal contribution: ${goal.name}`,
        category: 'savings',
        notes: notes || `Contribution to goal: ${goal.name}`,
        tags: ['goal-contribution', ...goal.tags]
      });
      
      await transaction.save();
      transactionId = transaction._id;
    }

    // Add contribution to goal
    await goal.addContribution(parseFloat(amount), source, transactionId, notes);

    res.json({
      success: true,
      message: 'Contribution added successfully',
      data: {
        goal,
        transactionCreated: !!transactionId,
        transactionId
      }
    });

  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({
      error: 'Failed to add contribution'
    });
  }
});

// @route   POST /api/goals/:id/withdraw
// @desc    Add withdrawal from goal
// @access  Private
router.post('/:id/withdraw', auth, [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Withdrawal amount must be greater than 0'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Reason must be between 1 and 100 characters'),
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

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found'
      });
    }

    const { amount, reason, createTransaction = true } = req.body;
    
    if (parseFloat(amount) > goal.currentAmount) {
      return res.status(400).json({
        error: 'Withdrawal amount exceeds current goal amount'
      });
    }

    let transactionId = null;

    // Create transaction if requested
    if (createTransaction) {
      const transaction = new Transaction({
        user: req.user.userId,
        type: 'income',
        amount: parseFloat(amount),
        description: `Goal withdrawal: ${goal.name}`,
        category: 'other-income',
        notes: `Withdrawal from goal: ${goal.name}. Reason: ${reason}`,
        tags: ['goal-withdrawal', ...goal.tags]
      });
      
      await transaction.save();
      transactionId = transaction._id;
    }

    // Add withdrawal to goal
    await goal.addWithdrawal(parseFloat(amount), reason, transactionId);

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        goal,
        transactionCreated: !!transactionId,
        transactionId
      }
    });

  } catch (error) {
    console.error('Add withdrawal error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process withdrawal'
    });
  }
});

// @route   GET /api/goals/summary/overview
// @desc    Get goals summary
// @access  Private
router.get('/summary/overview', auth, async (req, res) => {
  try {
    const summary = await Goal.getGoalsSummary(req.user.userId);
    
    // Transform the aggregation result into a more usable format
    const result = {
      active: { count: 0, totalTarget: 0, totalCurrent: 0 },
      completed: { count: 0, totalTarget: 0, totalCurrent: 0 },
      paused: { count: 0, totalTarget: 0, totalCurrent: 0 },
      cancelled: { count: 0, totalTarget: 0, totalCurrent: 0 }
    };

    summary.forEach(item => {
      if (result[item._id]) {
        result[item._id] = {
          count: item.count,
          totalTarget: item.totalTarget,
          totalCurrent: item.totalCurrent
        };
      }
    });

    // Calculate overall totals
    const totals = {
      totalGoals: summary.reduce((sum, item) => sum + item.count, 0),
      totalTargetAmount: summary.reduce((sum, item) => sum + item.totalTarget, 0),
      totalCurrentAmount: summary.reduce((sum, item) => sum + item.totalCurrent, 0)
    };

    totals.overallProgress = totals.totalTargetAmount > 0 
      ? (totals.totalCurrentAmount / totals.totalTargetAmount) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        byStatus: result,
        totals
      }
    });

  } catch (error) {
    console.error('Get goals summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch goals summary'
    });
  }
});

// @route   GET /api/goals/:id/progress
// @desc    Get goal progress details
// @access  Private
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found'
      });
    }

    const velocity = goal.getProgressVelocity();
    const projectedCompletion = goal.getProjectedCompletionDate();

    const progressData = {
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      progressPercentage: goal.progressPercentage,
      remainingAmount: goal.remainingAmount,
      daysRemaining: goal.daysRemaining,
      requiredMonthlyContribution: goal.requiredMonthlyContribution,
      isOverdue: goal.isOverdue,
      isCompleted: goal.isCompleted,
      progressVelocity: velocity,
      projectedCompletionDate: projectedCompletion,
      contributions: goal.contributions.sort((a, b) => new Date(b.date) - new Date(a.date)),
      withdrawals: goal.withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date)),
      milestones: goal.milestones
    };

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Get goal progress error:', error);
    res.status(500).json({
      error: 'Failed to fetch goal progress'
    });
  }
});

module.exports = router;
