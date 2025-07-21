# API Reference

This document provides detailed information about using the Instagram Token CLI programmatically and understanding the Instagram API endpoints.

## 📚 CLI API Reference

### Configuration Methods

#### `instagram-token init`

Initialize the CLI with Facebook App credentials.

**Usage:**
```bash
instagram-token init
```

**Interactive Prompts:**
- Facebook App ID
- Facebook App Secret
- Redirect URI (default: `https://localhost:3000/auth/callback`)

**Files Created:**
- `~/.instagram-cli/config.json` (non-sensitive config)
- System keychain entry for app secret

---

#### `instagram-token add [alias]`

Add a new Instagram account and obtain access token.

**Usage:**
```bash
instagram-token add my-account
instagram-token add  # Will prompt for alias
```

**Process:**
1. Generates OAuth authorization URL
2. User authorizes in browser
3. Exchanges authorization code for short-lived token
4. Exchanges short-lived token for long-lived token (60 days)
5. Stores token securely in system keychain

**Output:**
- Account alias
- Instagram username
- Account ID
- Token expiration date

---

#### `instagram-token list`

List all stored Instagram accounts.

**Usage:**
```bash
instagram-token list
instagram-token list --json  # JSON output
```

**Output Format:**
```
● my-account (default)
   Username: @myusername
   Account ID: 17841400455970123
   Status: Valid (45 days remaining)
   Last refreshed: 1/15/2024

○ backup-account
   Username: @backupuser
   Account ID: 17841400455970456
   Status: Expiring (3 days remaining)
   Last refreshed: 12/20/2023
```

---

#### `instagram-token use <alias>`

Set default Instagram account.

**Usage:**
```bash
instagram-token use my-account
```

**Effect:**
- Sets the specified account as default for operations
- Updates `~/.instagram-cli/settings.json`

---

#### `instagram-token info [alias]`

Get detailed account and token information.

**Usage:**
```bash
instagram-token info my-account
instagram-token info  # Uses default account
instagram-token info --token-only  # Output only the token
instagram-token info --json  # JSON output
```

**Output:**
```
📱 Account Information: my-account

Account Details:
   Alias: my-account
   Username: @myusername
   Account ID: 17841400455970123
   Account Type: BUSINESS

Token Information:
   Status: Valid (45 days remaining)
   Expires: 3/15/2024 at 2:30:45 PM
   Created: 1/15/2024
   Last Refreshed: 1/15/2024
   Access Token: IGQVJYWnBhdE1...
```

---

#### `instagram-token refresh [alias]`

Refresh access token for account.

**Usage:**
```bash
instagram-token refresh my-account
instagram-token refresh  # Refreshes default account
instagram-token refresh --all  # Refresh all accounts
```

**Process:**
1. Calls Instagram Graph API refresh endpoint
2. Updates stored token with new expiration
3. Updates last refreshed timestamp

---

#### `instagram-token remove <alias>`

Remove stored Instagram account.

**Usage:**
```bash
instagram-token remove old-account
```

**Process:**
1. Confirms deletion with user
2. Removes token from system keychain
3. Removes account metadata from storage
4. Updates default account if necessary

---

### Data Management

#### `instagram-token export [file]`

Export accounts and configuration.

**Usage:**
```bash
instagram-token export backup.json
instagram-token export  # Uses default filename with date
```

**Export Format:**
```json
{
  "version": "1.0.0",
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "config": {
    "appId": "1234567890123456",
    "redirectUri": "https://localhost:3000/auth/callback"
  },
  "accounts": {
    "my-account": {
      "accountInfo": {
        "id": "17841400455970123",
        "username": "myusername"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "lastRefreshed": "2024-01-15T10:00:00.000Z"
    }
  },
  "defaultAccount": "my-account"
}
```

> ⚠️ **Security Note**: App secrets and access tokens are not included in exports.

---

#### `instagram-token import <file>`

Import accounts and configuration.

**Usage:**
```bash
instagram-token import backup.json
```

**Process:**
1. Validates import file format
2. Shows preview of accounts to import
3. Confirms with user before proceeding
4. Imports account metadata (tokens must be re-obtained)

---

## 🔗 Instagram API Endpoints

### Account Information

#### Get Basic Account Info

**Endpoint:** `GET https://graph.instagram.com/me`

**Parameters:**
- `fields`: `id,username,account_type,media_count`
- `access_token`: Your long-lived access token

**Example:**
```bash
curl "https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "17841400455970123",
  "username": "myusername",
  "account_type": "BUSINESS",
  "media_count": 42
}
```

---

#### Get Detailed Account Info

**Endpoint:** `GET https://graph.instagram.com/me`

**Parameters:**
- `fields`: `id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,website,biography`
- `access_token`: Your long-lived access token

> 📝 **Note**: Some fields may not be available for all account types.

---

### Media Information

#### Get User Media

**Endpoint:** `GET https://graph.instagram.com/me/media`

**Parameters:**
- `fields`: `id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username`
- `limit`: Number of media items (default: 25, max: 100)
- `after`: Pagination cursor
- `access_token`: Your long-lived access token

**Example:**
```bash
curl "https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=10&access_token=YOUR_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "17895695668004550",
      "caption": "Beautiful sunset! 🌅",
      "media_type": "IMAGE",
      "media_url": "https://scontent.cdninstagram.com/...",
      "permalink": "https://www.instagram.com/p/ABC123/",
      "timestamp": "2024-01-15T18:30:00+0000"
    }
  ],
  "paging": {
    "cursors": {
      "before": "QVFIUmx1WTBpMGpRL...",
      "after": "QVFIUjBpNHlkUXlON..."
    },
    "next": "https://graph.instagram.com/me/media?after=QVFIUjBpNHlkUXlON..."
  }
}
```

---

#### Get Media Details

**Endpoint:** `GET https://graph.instagram.com/{media-id}`

**Parameters:**
- `fields`: `id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count`
- `access_token`: Your long-lived access token

**Example:**
```bash
curl "https://graph.instagram.com/17895695668004550?fields=id,caption,like_count,comments_count&access_token=YOUR_TOKEN"
```

---

### Token Management

#### Refresh Long-Lived Token

**Endpoint:** `GET https://graph.instagram.com/refresh_access_token`

**Parameters:**
- `grant_type`: `ig_refresh_token`
- `access_token`: Your current long-lived access token

**Example:**
```bash
curl "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=YOUR_TOKEN"
```

**Response:**
```json
{
  "access_token": "IGQVJYWnBhdE1BdHRfa...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

---

## 🛠 Programmatic Usage

### Using Tokens in Node.js

```javascript
const axios = require('axios');

class InstagramClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://graph.instagram.com';
  }

  async getAccountInfo() {
    const response = await axios.get(`${this.baseUrl}/me`, {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: this.accessToken
      }
    });
    return response.data;
  }

  async getMedia(limit = 25) {
    const response = await axios.get(`${this.baseUrl}/me/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,permalink,timestamp',
        limit,
        access_token: this.accessToken
      }
    });
    return response.data;
  }

  async refreshToken() {
    const response = await axios.get(`${this.baseUrl}/refresh_access_token`, {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: this.accessToken
      }
    });
    return response.data;
  }
}

// Usage
const client = new InstagramClient('YOUR_LONG_LIVED_TOKEN');
const account = await client.getAccountInfo();
console.log(`Hello, @${account.username}!`);
```

---

### Using with Environment Variables

```bash
# Export token from CLI
export INSTAGRAM_TOKEN=$(instagram-token info --token-only)

# Use in your application
node -e "
const token = process.env.INSTAGRAM_TOKEN;
fetch(\`https://graph.instagram.com/me?fields=id,username&access_token=\${token}\`)
  .then(r => r.json())
  .then(data => console.log('Account:', data));
"
```

---

### Batch Operations

```bash
#!/bin/bash
# Refresh all expiring tokens

instagram-token list --json | jq -r '.[] | select(.daysUntilExpiry < 7) | .alias' | while read account; do
  echo "Refreshing token for $account..."
  instagram-token refresh "$account"
done
```

---

## 🔐 Security Best Practices

### Token Storage

- **Never commit tokens** to version control
- **Use environment variables** for production
- **Rotate tokens regularly** (refresh every 30 days)
- **Monitor token expiration** and set up alerts

### API Usage

- **Respect rate limits** (200 requests per hour per user)
- **Handle errors gracefully** with proper retry logic
- **Use HTTPS only** for all API calls
- **Validate responses** before processing

### Example Error Handling

```javascript
async function safeApiCall(url, params) {
  try {
    const response = await axios.get(url, { params });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 400 && data.error?.code === 190) {
        // Invalid access token
        return { success: false, error: 'TOKEN_EXPIRED', message: 'Please refresh your token' };
      }
      
      if (status === 429) {
        // Rate limit exceeded
        return { success: false, error: 'RATE_LIMIT', message: 'Rate limit exceeded, try again later' };
      }
      
      return { success: false, error: 'API_ERROR', message: data.error?.message || 'Unknown API error' };
    }
    
    return { success: false, error: 'NETWORK_ERROR', message: error.message };
  }
}
```

---

## 📊 Rate Limits

### Instagram Basic Display API

- **200 requests per hour** per access token
- **Rate limit resets** every hour
- **No daily limits** for basic endpoints

### Best Practices

- **Cache responses** when possible
- **Batch requests** efficiently
- **Monitor usage** and implement backoff strategies
- **Use webhooks** for real-time updates instead of polling

---

## 🐛 Error Codes

### Common Error Responses

| Code | Type | Description | Solution |
|------|------|-------------|----------|
| 190 | OAuthException | Invalid access token | Refresh or re-obtain token |
| 100 | OAuthException | Unsupported request | Check endpoint and parameters |
| 4 | APIException | Rate limit exceeded | Wait and retry |
| 10 | OAuthException | Permission denied | Check app permissions |
| 803 | OAuthException | Some of the aliases you requested do not exist | Verify account exists |

### Error Response Format

```json
{
  "error": {
    "message": "Invalid access token",
    "type": "OAuthException",
    "code": 190,
    "fbtrace_id": "ABC123DEF456"
  }
}
```

---

**📖 For more information, visit the [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)**