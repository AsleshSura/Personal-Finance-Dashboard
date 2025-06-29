const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change';

const generateToken = (userId) => {
    return jwt.sign({userId}, JWT_SECRET, { expiresIn: '7d'});
};

router.post('/register', [
    body('name').trim().isLength({min:2, max:50}).withMessage('Name must be between 2 and 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email');
    body('password').isLength({min:6}).withMessage('Password must be at least 6 characters long').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {name,email,password,currency, timezone} = req.body;

        const existingUser = await UserActivation.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase(), password,
            currency: currency || 'USD',
            timezone: timezone || 'UTC'
        });

        await user.save();

        const token = generateToken(user._id);

        await user.updateLastLogin();

        res.status(201).json({
            success: 'true',
            message: 'User registered successfully',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error:'Registration failed',
            message: 'An error occurred during registration'
        });
    }
});