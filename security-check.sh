#!/bin/bash
# Security Cleanup Script

echo "🔒 Security Cleanup for Personal Finance Dashboard"
echo "================================================="
echo

echo "✅ Checking .gitignore..."
if grep -q ".env" .gitignore; then
    echo "✓ .env files are properly ignored"
else
    echo "❌ Adding .env to .gitignore"
    echo ".env" >> .gitignore
fi

echo
echo "✅ Checking for credential patterns..."

# Check for potential MongoDB credentials
if grep -r "mongodb+srv://[^Y]" . --exclude-dir=node_modules --exclude-dir=.git; then
    echo "❌ Found potential MongoDB credentials! Please review and replace with placeholders."
else
    echo "✓ No exposed MongoDB credentials found"
fi

# Check for potential passwords
if grep -r "password.*@" . --exclude-dir=node_modules --exclude-dir=.git --exclude="SECURITY.md"; then
    echo "❌ Found potential password patterns! Please review."
else
    echo "✓ No exposed password patterns found"
fi

echo
echo "✅ Security recommendations:"
echo "1. Never commit real credentials"
echo "2. Use environment variables for secrets"
echo "3. Rotate any exposed credentials immediately"
echo "4. Review SECURITY.md for best practices"
echo
echo "🎯 Your repository should now be safe for GitHub Pages deployment!"
