# Complete Setup Guide

This guide will walk you through setting up everything you need to use the Instagram Token CLI, from creating accounts to configuring your Facebook App.

## 📋 Overview

To use Instagram's API, you need:

1. **Instagram Business or Creator Account**
2. **Facebook Page** (connected to Instagram)
3. **Facebook App** (with Instagram Basic Display API)
4. **Instagram Token CLI** (this tool)

## 🎯 Step 1: Instagram Account Setup

### Option A: Convert Personal to Business Account

1. Open Instagram mobile app
2. Go to **Settings** → **Account** → **Switch to Professional Account**
3. Choose **Business** or **Creator**
4. Complete the setup process

### Option B: Create New Business Account

1. Create a new Instagram account
2. Follow the steps above to convert to Business/Creator

> ⚠️ **Important**: Personal Instagram accounts cannot use the Instagram Basic Display API for long-term tokens.

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
4. Log in with your Instagram Business/Creator account
5. Authorize the connection

> 📝 **Note**: This connection is required for the Instagram Graph API to work properly.

## 🔧 Step 3: Create Facebook App

### 1. Access Facebook Developers

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as the app type
4. Fill in your app details:
   - **App Name**: `My Instagram Token App` (or your preferred name)
   - **App Contact Email**: Your email address
   - **App Purpose**: Choose appropriate purpose

### 2. Configure Basic Settings

1. In your app dashboard, go to **Settings** → **Basic**
2. Note down your **App ID** and **App Secret** (you'll need these later)
3. Add **App Domains**: `localhost` (for development)
4. **Privacy Policy URL**: Add if you have one (required for some features)

### 3. Add Instagram Basic Display Product

1. In your app dashboard, click **Add Product**
2. Find **Instagram Basic Display** and click **Set Up**
3. Go to **Instagram Basic Display** → **Basic Display**

### 4. Configure Instagram Basic Display

#### Create Instagram App

1. Click **Create New App**
2. Fill in the details:
   - **Display Name**: Your app name
   - **Valid OAuth Redirect URIs**: 
     ```
     https://localhost:3000/auth/callback
     http://localhost:3000/auth/callback
     ```
   - **Deauthorize Callback URL**: `https://localhost:3000/deauth` (optional)
   - **Data Deletion Request URL**: `https://localhost:3000/deletion` (optional)

#### Add Instagram Testers

1. Go to **Roles** → **Roles**
2. Click **Add Instagram Testers**
3. Add your Instagram username
4. Accept the invitation in your Instagram app:
   - Go to **Settings** → **Apps and Websites** → **Tester Invites**
   - Accept the invitation

### 5. App Review (Optional)

For production use, you may need to submit your app for review:

1. Go to **App Review** → **Permissions and Features**
2. Request permissions for:
   - `instagram_graph_user_profile`
   - `instagram_graph_user_media`

> 📝 **Note**: For personal use and testing, the tester setup is sufficient.

## 🛠 Step 4: Install Instagram Token CLI

### Global Installation

```bash
npm install -g instagram-token-cli
```

### Verify Installation

```bash
instagram-token --version
```

## ⚙️ Step 5: Configure the CLI

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

## 🔐 Step 6: Obtain Your First Token

### Add Instagram Account

```bash
instagram-token add my-account
```

### Follow OAuth Flow

1. **Copy the URL**: The CLI will generate an OAuth URL
2. **Open in Browser**: Paste the URL in your browser
3. **Authorize**: Log in and authorize your app
4. **Copy Redirect URL**: After authorization, copy the entire URL from your browser's address bar
5. **Paste in Terminal**: Return to the terminal and paste the redirect URL

### Example OAuth Flow

```
📱 Adding Instagram Account

🔐 Starting OAuth flow...

1. Open the following URL in your browser:
https://api.instagram.com/oauth/authorize?client_id=123...

? Would you like me to open this URL in your browser? Yes

2. After authorizing, you will be redirected to your redirect URI.
3. Copy the entire redirect URL from your browser address bar.

? Paste the redirect URL here: https://localhost:3000/auth/callback?code=AQD...

✅ Account "my-account" added successfully!

✅ Account Details:
   Alias: my-account
   Username: @yourusername
   Account ID: 17841400455970123
   Token expires: 3/22/2024
```

## ✅ Step 7: Verify Setup

### Check Account Status

```bash
instagram-token list
```

### Get Account Information

```bash
instagram-token info my-account
```

### Test API Connection

```bash
# This will test various API endpoints
instagram-token info my-account --test-connection
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "Invalid Redirect URI"

**Cause**: The redirect URI in your Facebook App doesn't match the one you're using.

**Solution**:
1. Go to Facebook App → Instagram Basic Display → Basic Display
2. Ensure `https://localhost:3000/auth/callback` is in **Valid OAuth Redirect URIs**
3. Make sure there are no extra spaces or characters

#### Issue: "User not authorized as a tester"

**Cause**: Your Instagram account isn't added as a tester.

**Solution**:
1. Go to Facebook App → Roles → Roles
2. Add your Instagram username as a tester
3. Accept the invitation in Instagram app

#### Issue: "App not approved for instagram_graph_user_profile"

**Cause**: Your app needs approval for certain permissions.

**Solution**:
- For testing: Ensure you're added as a tester (sufficient for development)
- For production: Submit app for review in App Review section

#### Issue: "Token expires too quickly"

**Cause**: You're getting short-lived tokens instead of long-lived ones.

**Solution**:
- The CLI automatically exchanges short-lived for long-lived tokens
- If this fails, check your app configuration and try again

### Debug Mode

Enable detailed logging:

```bash
DEBUG=instagram-token:* instagram-token add test-account
```

### Reset and Start Over

If you encounter persistent issues:

```bash
# Remove CLI configuration
rm -rf ~/.instagram-cli

# Reinitialize
instagram-token init
```

## 📚 Additional Resources

### Facebook Documentation

- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook App Development](https://developers.facebook.com/docs/development)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

### Instagram Resources

- [Instagram Business Tools](https://business.instagram.com/)
- [Creator Account Setup](https://help.instagram.com/502981923235522)

### API References

- [Instagram Basic Display Endpoints](https://developers.facebook.com/docs/instagram-basic-display-api/reference)
- [OAuth 2.0 Flow](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)

## 🎉 Next Steps

Once you have your token:

1. **Explore API endpoints** using your token
2. **Set up auto-refresh** for long-term use
3. **Build your application** using the Instagram API
4. **Monitor token expiration** and refresh as needed

### Example API Usage

```bash
# Get your account info
curl "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_TOKEN"

# Get your media
curl "https://graph.instagram.com/me/media?fields=id,caption,media_url&access_token=YOUR_TOKEN"
```

### Using in Your Applications

```javascript
const token = 'YOUR_LONG_LIVED_TOKEN';

// Get account information
const response = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count&access_token=${token}`);
const account = await response.json();

console.log(`Hello, @${account.username}! You have ${account.media_count} posts.`);
```

---

**🎊 Congratulations!** You now have a working Instagram API setup with long-term access tokens. Happy coding!