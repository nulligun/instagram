# Instagram Token CLI Examples

This directory contains example scripts and usage patterns for the Instagram Token CLI.

## 📁 Files

### [`basic-usage.js`](basic-usage.js)
A Node.js script demonstrating how to:
- Get account information using the CLI
- Extract access tokens programmatically
- Make direct API calls to Instagram Graph API
- Handle common errors and provide helpful solutions

**Usage:**
```bash
node examples/basic-usage.js
```

**Prerequisites:**
- CLI must be initialized (`instagram-token init`)
- At least one account must be added (`instagram-token add`)

---

### [`token-management.sh`](token-management.sh)
A comprehensive bash script for token management operations:
- Check token status for all accounts
- Automatically refresh expiring tokens
- Validate tokens by making test API calls
- Create backups of account configurations
- Interactive and command-line modes

**Usage:**
```bash
# Interactive mode
./examples/token-management.sh

# Command line mode
./examples/token-management.sh status
./examples/token-management.sh refresh
./examples/token-management.sh validate
./examples/token-management.sh backup
./examples/token-management.sh all
```

**Features:**
- 🔄 Auto-refresh tokens expiring within 7 days
- ✅ Validate tokens with actual API calls
- 💾 Create timestamped backups
- 📊 Comprehensive status reporting
- 🎯 Interactive menu system

---

## 🚀 Quick Start Examples

### 1. Initialize and Add Account
```bash
# Initialize CLI with your Facebook App credentials
instagram-token init

# Add your Instagram account
instagram-token add my-account

# Verify it worked
instagram-token list
```

### 2. Get Account Information
```bash
# Show detailed account info
instagram-token info my-account

# Get just the access token
instagram-token info my-account --token-only

# Get info in JSON format
instagram-token info my-account --json
```

### 3. Use Token in API Calls
```bash
# Get your access token
TOKEN=$(instagram-token info --token-only)

# Get account information
curl "https://graph.instagram.com/me?fields=id,username,media_count&access_token=$TOKEN"

# Get recent media
curl "https://graph.instagram.com/me/media?fields=id,caption,media_type,permalink&limit=5&access_token=$TOKEN"
```

### 4. Token Management
```bash
# Refresh a specific token
instagram-token refresh my-account

# List all accounts with status
instagram-token list

# Remove an account
instagram-token remove old-account
```

### 5. Backup and Restore
```bash
# Export configuration and accounts
instagram-token export my-backup.json

# Import from backup (tokens need to be re-obtained)
instagram-token import my-backup.json
```

---

## 🔧 Advanced Usage Patterns

### Automated Token Refresh
Set up a cron job to automatically refresh expiring tokens:

```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * /path/to/examples/token-management.sh refresh >> /var/log/instagram-token-refresh.log 2>&1
```

### Environment Variable Integration
```bash
# Export default account token
export INSTAGRAM_TOKEN=$(instagram-token info --token-only)

# Use in your applications
echo "Token: $INSTAGRAM_TOKEN"
```

### Multiple Account Management
```bash
# Add multiple accounts
instagram-token add personal-account
instagram-token add business-account
instagram-token add client-account

# Set default account
instagram-token use business-account

# Get info for specific account
instagram-token info personal-account
```

### Programmatic Usage in Node.js
```javascript
const { execSync } = require('child_process');

// Get account list
const accounts = JSON.parse(execSync('instagram-token list --json', { encoding: 'utf8' }));

// Get token for specific account
const token = execSync('instagram-token info my-account --token-only', { encoding: 'utf8' }).trim();

// Use token in your application
const response = await fetch(`https://graph.instagram.com/me?access_token=${token}`);
const account = await response.json();
```

---

## 🐛 Troubleshooting Examples

### Check CLI Status
```bash
# Verify CLI is working
instagram-token --version

# Check if initialized
instagram-token list

# Validate a specific token
./examples/token-management.sh validate
```

### Common Issues and Solutions

#### "Configuration not found"
```bash
# Solution: Initialize the CLI
instagram-token init
```

#### "No accounts found"
```bash
# Solution: Add an account
instagram-token add my-account
```

#### "Token expired"
```bash
# Solution: Refresh the token
instagram-token refresh my-account

# Or use the management script
./examples/token-management.sh refresh
```

#### "Invalid access token"
```bash
# Solution: Re-add the account
instagram-token remove problematic-account
instagram-token add problematic-account
```

---

## 📚 API Usage Examples

### Get Account Information
```bash
TOKEN=$(instagram-token info --token-only)

# Basic account info
curl "https://graph.instagram.com/me?fields=id,username,account_type&access_token=$TOKEN"

# Detailed account info (may not work for all account types)
curl "https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count&access_token=$TOKEN"
```

### Get Media
```bash
TOKEN=$(instagram-token info --token-only)

# Get recent media
curl "https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=10&access_token=$TOKEN"

# Get specific media details
MEDIA_ID="your_media_id"
curl "https://graph.instagram.com/$MEDIA_ID?fields=id,caption,like_count,comments_count&access_token=$TOKEN"
```

### Refresh Token
```bash
TOKEN=$(instagram-token info --token-only)

# Refresh long-lived token
curl "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=$TOKEN"
```

---

## 🔐 Security Best Practices

1. **Never commit tokens to version control**
2. **Use environment variables in production**
3. **Rotate tokens regularly (every 30 days)**
4. **Monitor token expiration**
5. **Use HTTPS for all API calls**
6. **Handle rate limits gracefully**

### Example Secure Usage
```bash
# Store token in environment variable
export INSTAGRAM_TOKEN=$(instagram-token info --token-only)

# Use in your application without exposing the token
node -e "
const token = process.env.INSTAGRAM_TOKEN;
if (!token) {
  console.error('INSTAGRAM_TOKEN not set');
  process.exit(1);
}
// Use token safely...
"
```

---

## 🤝 Contributing Examples

Have a useful example or pattern? We'd love to include it! Please:

1. Create a new file in the `examples/` directory
2. Add documentation explaining the use case
3. Include error handling and best practices
4. Update this README with your example
5. Submit a pull request

---

**💡 Need help?** Check out the [main documentation](../README.md) or [setup guide](../docs/SETUP.md).