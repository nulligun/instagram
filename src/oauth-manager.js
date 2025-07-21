const axios = require('axios');
const crypto = require('crypto');

class OAuthManager {
  constructor() {
    this.baseUrl = 'https://api.instagram.com';
    this.graphUrl = 'https://graph.instagram.com';
  }

  /**
   * Generate Instagram OAuth authorization URL
   */
  generateAuthUrl(config) {
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id: config.appId,
      redirect_uri: config.redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      state: state
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for short-lived access token
   */
  async exchangeCodeForToken(code, config) {
    try {
      const response = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: config.appId,
        client_secret: config.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
        code: code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: [(data) => {
          return Object.keys(data)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
            .join('&');
        }]
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`OAuth error: ${error.response.data.error_message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async exchangeForLongLivedToken(shortLivedToken, config) {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: config.appSecret,
        access_token: shortLivedToken.access_token
      });

      const response = await axios.get(`${this.graphUrl}/access_token?${params.toString()}`);

      return {
        access_token: response.data.access_token,
        token_type: response.data.token_type || 'bearer',
        expires_in: response.data.expires_in || 5184000 // 60 days default
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Token exchange error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Refresh long-lived access token
   */
  async refreshLongLivedToken(accessToken, config) {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: accessToken
      });

      const response = await axios.get(`${this.graphUrl}/refresh_access_token?${params.toString()}`);

      return {
        access_token: response.data.access_token,
        token_type: 'bearer',
        expires_in: response.data.expires_in || 5184000 // 60 days default
      };
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data.error;
        throw new Error(`Token refresh error: ${errorData?.message || errorData || 'Unknown error'}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Validate access token by making a test API call
   */
  async validateToken(accessToken) {
    try {
      const response = await axios.get(`${this.graphUrl}/me`, {
        params: {
          fields: 'id,username',
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
   * Generate Facebook OAuth URL for Page Access Token (alternative flow)
   */
  generateFacebookAuthUrl(config) {
    const state = crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      client_id: config.appId,
      redirect_uri: config.redirectUri,
      scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights',
      response_type: 'code',
      state: state
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange Facebook authorization code for access token
   */
  async exchangeFacebookCodeForToken(code, config) {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
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
   * Get user's Facebook pages
   */
  async getFacebookPages(accessToken) {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
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
}

module.exports = OAuthManager;