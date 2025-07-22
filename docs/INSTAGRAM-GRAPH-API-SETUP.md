# Instagram Graph API Setup Guide

**IMPORTANT**: Instagram Basic Display API has been discontinued. This CLI now uses the Instagram Graph API, which requires a different setup process.

## 📋 Overview

The Instagram Graph API requires:

1. **Facebook Business App** (not Consumer app)
2. **Instagram Business Account** (not personal account)
3. **Facebook Page** connected to your Instagram Business Account
4. **Facebook User Access Token** with appropriate permissions

## 🎯 Step 1: Convert Instagram to Business Account

### If You Have a Personal Instagram Account

1. Open Instagram mobile app
2. Go to **Settings** → **Account** → **Switch to Professional Account**
3. Choose **Business**
4. Complete the setup process

> ⚠️ **Important**: Personal Instagram accounts cannot use the Instagram Graph API.

## 📄 Step 2: Create Facebook Page

### If You Don't Have a Facebook Page

1. Go to [Facebook Pages](https://www.facebook.com/pages/create)
2. Choose **Business or Brand**
3. Enter your page name and category
4. Complete the setup process

### Connect Instagram to Facebook Page

1. Go to your Facebook Page
2. Click **Settings** → **Instagram**
3. Click **Connect Account**
4. Log in with your Instagram Business account
5. Authorize the connection

> 📝 **Note**: This connection is required for the Instagram Graph API to work.

## 🔧 Step 3: Create Facebook Business App

### 1. Access Facebook Developers

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. **IMPORTANT**: Choose **Business** as the app type (not Consumer)
4. Fill in your app details:
   - **App Name**: `My Instagram API App` (or your preferred name)
   - **App Contact Email**: Your email address

### 2. Configure Basic Settings

1. In your app dashboard, go to **Settings** → **Basic**
2. Note down your **App ID** and **App Secret** (you'll need these later)
3. Add **App Domains**: `localhost` (for development)
4. **Privacy Policy URL**: Add if you have one

### 3. Add Instagram Graph API Product

1. In your app dashboard, click **Add Product**
2. Find **Instagram Graph API** and click **Set Up**
3. This will add the necessary permissions to your app

### 4. Configure OAuth Redirect URIs

1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://localhost:3000/auth/callback
   http://localhost:3000/auth/callback
   ```

### 5. Request Permissions

For the Instagram Graph API, you need these essential permissions:
- `pages_show_list` - To access your Facebook pages
- `pages_read_engagement` - To read page engagement data
- `instagram_basic` - Basic Instagram access

**Note**: Additional permissions like `instagram_manage_insights` may require app review and are not needed for basic token management.

## ⚙️ Step 4: Configure the CLI

### Initialize Configuration

```bash
instagram-token init
```

You'll be prompted for:

1. **Facebook App ID**: From Step 3.2
2. **Facebook App Secret**: From Step 3.2  
3. **Redirect URI**: Use `https://localhost:3000/auth/callback`

### Example Configuration

```
🚀 Instagram Token CLI Initialization

Please provide your Facebook App credentials:
(You can find these in your Facebook Developer Console)

? Facebook App ID: 1234567890123456
? Facebook App Secret: ********************************
? Redirect URI: https://localhost:3000/auth/callback
```

## 🔐 Step 5: Obtain Your First Token

### Add Instagram Account

```bash
instagram-token add my-account
```

### Follow Facebook OAuth Flow

1. **Authorize Facebook**: The CLI will open Facebook's OAuth page
2. **Grant Permissions**: Allow access to your pages and Instagram account
3. **Select Facebook Page**: Choose the page connected to your Instagram account
4. **Complete Setup**: The CLI will automatically get your Instagram Business Account details

### Example OAuth Flow

```
📱 Adding Instagram Account

🔐 Starting Facebook OAuth flow for Instagram Graph API...

Note: This will authenticate with Facebook to access your Instagram Business Account.

1. Open the following URL in your browser:
https://www.facebook.com/v18.0/dialog/oauth?client_id=123...

? Would you like me to open this URL in your browser? Yes

2. After authorizing, you will be redirected to your redirect URI.
3. Copy the entire redirect URL from your browser address bar.

? Paste the redirect URL here: https://localhost:3000/auth/callback?code=AQD...

? Select the Facebook page connected to your Instagram account: My Business Page (ID: 123456789)

✅ Account "my-account" added successfully!

✅ Account Details:
   Alias: my-account
   Instagram Username: @yourusername
   Instagram Account ID: 17841400455970123
   Facebook Page: My Business Page
   Token expires: 3/22/2024
```

## ✅ Step 6: Verify Setup

### Check Account Status

```bash
instagram-token list
```

### Get Account Information

```bash
instagram-token info my-account
```

This will show:
- Instagram account details
- Facebook page integration
- Token status and expiration

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "No Facebook pages found"

**Cause**: You don't have any Facebook pages, or they're not accessible.

**Solution**:
1. Create a Facebook page first
2. Ensure you're an admin of the page
3. Make sure the page is published (not in draft mode)

#### Issue: "No Instagram Business Account found for this Facebook page"

**Cause**: Your Instagram account isn't connected to the Facebook page, or it's not a Business account.

**Solution**:
1. Convert your Instagram account to Business
2. Go to your Facebook page → Settings → Instagram
3. Connect your Instagram Business account

#### Issue: "Invalid Platform App" or "App not approved"

**Cause**: Your Facebook app is set to Consumer type, or missing required permissions.

**Solution**:
1. Ensure your Facebook app is **Business** type (not Consumer)
2. Add Instagram Graph API product to your app
3. Request the necessary permissions listed above

#### Issue: "Token expires too quickly"

**Cause**: You're getting short-lived tokens instead of long-lived ones.

**Solution**:
- The CLI automatically exchanges for long-lived tokens
- Facebook page tokens can be long-lived (60 days)
- Refresh tokens before they expire using `instagram-token refresh`

### Debug Mode

Enable detailed logging:

```bash
DEBUG=instagram-token:* instagram-token add test-account
```

## 📚 Key Differences from Instagram Basic Display API

| Aspect | Basic Display API (Deprecated) | Instagram Graph API (Current) |
|--------|--------------------------------|-------------------------------|
| **App Type** | Consumer | Business |
| **Account Type** | Personal Instagram | Business Instagram |
| **Authentication** | Direct Instagram OAuth | Facebook OAuth |
| **Requirements** | Instagram account only | Instagram + Facebook Page |
| **Permissions** | `user_profile`, `user_media` | `pages_*`, `instagram_*` |
| **Token Type** | Instagram token | Facebook Page token |
| **API Endpoint** | `api.instagram.com` | `graph.facebook.com` |

## 🎉 Next Steps

Once you have your token:

1. **Explore API endpoints** using your token
2. **Set up auto-refresh** for long-term use
3. **Build your application** using the Instagram Graph API
4. **Monitor token expiration** and refresh as needed

### Example API Usage

```bash
# Get your Instagram account info
curl "https://graph.facebook.com/v18.0/YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID?fields=id,username,name,media_count&access_token=YOUR_TOKEN"

# Get your media
curl "https://graph.facebook.com/v18.0/YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID/media?fields=id,caption,media_url&access_token=YOUR_TOKEN"
```

---

**🎊 Congratulations!** You now have a working Instagram Graph API setup with long-term access tokens. Happy coding!