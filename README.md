# Instagram Token CLI

A powerful command-line tool for obtaining and managing Instagram long-term access tokens using the Instagram Graph API. This tool simplifies the Facebook OAuth flow and provides secure token storage with support for multiple Instagram Business accounts.

## 🚨 Important Update

**Instagram Basic Display API has been discontinued.** This CLI now uses the **Instagram Graph API**, which requires:

- **Facebook Business App** (not Consumer app)
- **Instagram Business Account** (not personal account)
- **Facebook Page** connected to your Instagram account

## 🚀 Features

- **Facebook OAuth Integration**: Seamless authentication through Facebook
- **Instagram Business Account Support**: Works with Instagram Graph API
- **Multiple Account Support**: Store and manage tokens for different Instagram accounts
- **Secure Token Storage**: Encrypted credentials using system keychain
- **Auto-refresh Capability**: Automatically refresh Facebook tokens before expiration
- **Comprehensive CLI Commands**: Full suite of token management commands
- **Export/Import**: Backup and restore your account configurations
- **Token Validation**: Verify token status and permissions

## 📋 Prerequisites

Before using this tool, you need to set up:

1. **Instagram Business Account** (converted from personal account)
2. **Facebook Page** (connected to your Instagram Business account)
3. **Facebook Business App** (with Instagram Graph API enabled)

> 📖 **New to Instagram Graph API?** Check out our [Instagram Graph API Setup Guide](docs/INSTAGRAM-GRAPH-API-SETUP.md) for detailed instructions.

## 🛠 Installation

### Global Installation (Recommended)

```bash
npm install -g instagram-token-cli
```

### Local Installation

```bash
npm install instagram-token-cli
npx instagram-token --help
```

### From Source

```bash
git clone https://github.com/yourusername/instagram-token-cli.git
cd instagram-token-cli
npm install
npm link
```

## 🎯 Quick Start

### 1. Initialize Configuration

```bash
instagram-token init
```

This will prompt you for:
- Facebook App ID
- Facebook App Secret
- Redirect URI (default: `https://localhost:3000/auth/callback`)

### 2. Add Your First Instagram Account

```bash
instagram-token add my-account
```

Follow the OAuth flow:
1. Copy the generated URL and open it in your browser
2. Authorize the application
3. Copy the redirect URL from your browser
4. Paste it back into the terminal

### 3. Verify Your Token

```bash
instagram-token info my-account
```

## 📚 Commands

### Configuration Commands

#### `instagram-token init`
Initialize the CLI with your Facebook App credentials.

```bash
instagram-token init
```

### Account Management Commands

#### `instagram-token add [alias]`
Add a new Instagram account and obtain its access token.

```bash
instagram-token add my-business-account
instagram-token add personal-account
```

#### `instagram-token list`
List all stored Instagram accounts with their status.

```bash
instagram-token list
```

#### `instagram-token use <alias>`
Set the default Instagram account for operations.

```bash
instagram-token use my-business-account
```

#### `instagram-token info [alias]`
Get detailed information about an account and its token.

```bash
instagram-token info my-business-account
instagram-token info  # Uses default account
```

#### `instagram-token refresh [alias]`
Refresh the access token for an account.

```bash
instagram-token refresh my-business-account
instagram-token refresh  # Refreshes default account
```

#### `instagram-token remove <alias>`
Remove a stored Instagram account.

```bash
instagram-token remove old-account
```

### Data Management Commands

#### `instagram-token export [file]`
Export accounts and configuration to a backup file.

```bash
instagram-token export my-backup.json
instagram-token export  # Uses default filename
```

#### `instagram-token import <file>`
Import accounts and configuration from a backup file.

```bash
instagram-token import my-backup.json
```

## 🔧 Configuration

The CLI stores configuration in `~/.instagram-cli/`:

```
~/.instagram-cli/
├── config.json          # App configuration (non-sensitive)
├── accounts.json         # Account metadata (no tokens)
└── settings.json         # CLI settings
```

Sensitive data (tokens, app secrets) are stored securely in your system's keychain.

## 🔐 Security

- **App secrets** are stored in system keychain (Keychain on macOS, Credential Manager on Windows, libsecret on Linux)
- **Access tokens** are encrypted and stored separately from metadata
- **Token integrity** is verified using SHA-256 hashes
- **No sensitive data** is stored in plain text files

## 🔄 Token Management

### Token Lifecycle

1. **Short-lived token** (1 hour) obtained via OAuth
2. **Long-lived token** (60 days) exchanged automatically
3. **Auto-refresh** available before expiration
4. **Validation** checks token status and permissions

### Token Status

- 🟢 **Valid**: Token is active with >7 days remaining
- 🟡 **Expiring**: Token expires within 7 days
- 🔴 **Expired**: Token has expired and needs refresh

## 📖 Advanced Usage

### Using Tokens in Your Applications

After obtaining tokens, you can use them in your applications:

```javascript
// Get account info
const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${token}`);
const account = await response.json();

// Get media
const mediaResponse = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_url&access_token=${token}`);
const media = await mediaResponse.json();
```

### Environment Variables

You can also access your tokens programmatically:

```bash
# Export default account token
export INSTAGRAM_TOKEN=$(instagram-token info --token-only)

# Use in your scripts
curl "https://graph.instagram.com/me?access_token=$INSTAGRAM_TOKEN"
```

### Automation Scripts

```bash
#!/bin/bash
# Auto-refresh all tokens
instagram-token list --json | jq -r '.[] | select(.daysUntilExpiry < 7) | .alias' | while read account; do
  echo "Refreshing $account..."
  instagram-token refresh "$account"
done
```

## 🐛 Troubleshooting

### Common Issues

#### "Configuration not found"
```bash
# Solution: Initialize the CLI first
instagram-token init
```

#### "Token not found in secure storage"
```bash
# Solution: Re-add the account
instagram-token remove problematic-account
instagram-token add problematic-account
```

#### "OAuth error: Invalid redirect URI"
```bash
# Solution: Check your Facebook App settings
# Ensure the redirect URI matches exactly
```

#### "Instagram API error: Invalid access token"
```bash
# Solution: Refresh the token
instagram-token refresh your-account
```

### Debug Mode

Enable verbose logging:

```bash
DEBUG=instagram-token:* instagram-token add test-account
```

### Reset Configuration

If you encounter persistent issues:

```bash
# Remove all configuration and start fresh
rm -rf ~/.instagram-cli
instagram-token init
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/yourusername/instagram-token-cli.git
cd instagram-token-cli
npm install
npm run dev
```

### Running Tests

```bash
npm test
npm run test:watch
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/instagram-token-cli/issues)
- 💬 [Discussions](https://github.com/yourusername/instagram-token-cli/discussions)

## 🙏 Acknowledgments

- Instagram Basic Display API
- Facebook Graph API
- Node.js community

---

**Made with ❤️ for the Instagram developer community**