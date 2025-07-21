#!/usr/bin/env node

/**
 * Basic Usage Example
 * 
 * This example shows how to use the Instagram Token CLI programmatically
 * to get account information and media.
 */

const { execSync } = require('child_process');
const axios = require('axios');

async function basicUsageExample() {
  console.log('🚀 Instagram Token CLI - Basic Usage Example\n');

  try {
    // Get account info using CLI
    console.log('📱 Getting account information...');
    const accountInfo = execSync('instagram-token info --json', { encoding: 'utf8' });
    const account = JSON.parse(accountInfo);
    
    console.log(`✅ Account: @${account.username} (${account.accountType})`);
    console.log(`📊 Account ID: ${account.id}`);
    console.log(`🗓️  Token expires: ${account.tokenExpiry}\n`);

    // Get access token
    const accessToken = execSync('instagram-token info --token-only', { encoding: 'utf8' }).trim();
    
    // Use token to make API calls
    console.log('📸 Fetching recent media...');
    const mediaResponse = await axios.get('https://graph.instagram.com/me/media', {
      params: {
        fields: 'id,caption,media_type,media_url,permalink,timestamp',
        limit: 5,
        access_token: accessToken
      }
    });

    const media = mediaResponse.data.data;
    console.log(`✅ Found ${media.length} recent posts:\n`);

    media.forEach((post, index) => {
      console.log(`${index + 1}. ${post.media_type} - ${new Date(post.timestamp).toLocaleDateString()}`);
      console.log(`   Caption: ${post.caption ? post.caption.substring(0, 50) + '...' : 'No caption'}`);
      console.log(`   URL: ${post.permalink}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Configuration not found')) {
      console.log('\n💡 Solution: Run "instagram-token init" first to configure the CLI.');
    } else if (error.message.includes('No accounts found')) {
      console.log('\n💡 Solution: Run "instagram-token add my-account" to add an Instagram account.');
    }
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample();
}

module.exports = basicUsageExample;