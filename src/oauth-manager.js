const axios = require('axios');
const crypto = require('crypto');

class OAuthManager {
  constructor() {
    this.facebookGraphUrl = 'https://graph.facebook.com/v18.0';
    this.facebookDialogUrl = 'https://www.facebook.com/v18.0/dialog/oauth';
  }

  /**
   * Generate Facebook OAuth authorization URL for Instagram Graph API
   * This replaces the deprecated Instagram Basic Display API flow
   */
  generateAuthUrl(config) {
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id: config.appId,
      redirect_uri: config.redirectUri,
      scope: 'pages_show_list,pages_read_engagement,instagram_basic',
      response_type: 'code',
      state: state
    });

    return `${this.facebookDialogUrl}?${params.toString()}`;
  }

  /**
   * Exchange Facebook authorization code for short-lived access token
   * This replaces the deprecated Instagram Basic Display API token exchange
   */
  async exchangeCodeForToken(code, config) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/oauth/access_token`, {
        params: {
          client_id: config.appId,
          client_secret: config.appSecret,
          redirect_uri: config.redirectUri,
          code: code
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Facebook OAuth error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Exchange short-lived Facebook token for long-lived token (60 days)
   * Uses Facebook's token exchange mechanism for Instagram Graph API
   */
  async exchangeForLongLivedToken(shortLivedToken, config) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.appId,
          client_secret: config.appSecret,
          fb_exchange_token: shortLivedToken.access_token
        }
      });

      return {
        access_token: response.data.access_token,
        token_type: response.data.token_type || 'bearer',
        expires_in: response.data.expires_in || 5184000 // 60 days default
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Facebook token exchange error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Refresh long-lived Facebook access token
   * Uses Facebook's token refresh mechanism for Instagram Graph API
   */
  async refreshLongLivedToken(accessToken, config) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.appId,
          client_secret: config.appSecret,
          fb_exchange_token: accessToken
        }
      });

      return {
        access_token: response.data.access_token,
        token_type: 'bearer',
        expires_in: response.data.expires_in || 5184000 // 60 days default
      };
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data.error;
        throw new Error(`Facebook token refresh error: ${errorData?.message || errorData || 'Unknown error'}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Validate Facebook access token by making a test API call
   */
  async validateToken(accessToken) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/me`, {
        params: {
          fields: 'id,name',
          access_token: accessToken
        }
      });

      return {
        valid: true,
        data: response.data
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get Instagram Business Account ID from Facebook Page
   */
  async getInstagramBusinessAccount(pageAccessToken, pageId) {
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken
        }
      });

      return response.data.instagram_business_account?.id || null;
    } catch (error) {
      if (error.response) {
        throw new Error(`Facebook API error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Get user's Facebook pages
   */
  async getFacebookPages(accessToken) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/me/accounts`, {
        params: {
          access_token: accessToken
        }
      });

      return response.data.data || [];
    } catch (error) {
      if (error.response) {
        throw new Error(`Facebook API error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Get Instagram Business Account information from a Facebook Page
   */
  async getInstagramAccountFromPage(pageAccessToken, pageId) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/${pageId}`, {
        params: {
          fields: 'instagram_business_account{id,username,name,profile_picture_url}',
          access_token: pageAccessToken
        }
      });

      return response.data.instagram_business_account || null;
    } catch (error) {
      if (error.response) {
        throw new Error(`Facebook API error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Validate Instagram Business Account access
   */
  async validateInstagramAccess(accessToken, businessAccountId) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/${businessAccountId}`, {
        params: {
          fields: 'id,username,name,media_count',
          access_token: accessToken
        }
      });

      return {
        valid: true,
        data: response.data
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}

module.exports = OAuthManager;