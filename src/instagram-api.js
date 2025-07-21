const axios = require('axios');

class InstagramAPI {
  constructor() {
    this.baseUrl = 'https://graph.instagram.com';
    this.version = 'v18.0';
  }

  /**
   * Get Instagram account information
   */
  async getAccountInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Instagram API error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Get detailed account information including insights
   */
  async getDetailedAccountInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,website,biography',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data.error;
        // Some fields might not be available for all account types
        if (errorData?.code === 100 && errorData?.message?.includes('Unsupported get request')) {
          // Fallback to basic info
          return await this.getAccountInfo(accessToken);
        }
        throw new Error(`Instagram API error: ${errorData?.message || errorData}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Get user's media (posts)
   */
  async getMedia(accessToken, limit = 25, after = null) {
    try {
      const params = {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username',
        limit: limit,
        access_token: accessToken
      };

      if (after) {
        params.after = after;
      }

      const response = await axios.get(`${this.baseUrl}/me/media`, {
        params
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Instagram API error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Get specific media item details
   */
  async getMediaDetails(mediaId, accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/${mediaId}`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count',
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Instagram API error: ${error.response.data.error?.message || error.response.data.error}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Get media insights (for business accounts)
   */
  async getMediaInsights(mediaId, accessToken, metrics = ['impressions', 'reach', 'engagement']) {
    try {
      const response = await axios.get(`${this.baseUrl}/${mediaId}/insights`, {
        params: {
          metric: metrics.join(','),
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data.error;
        // Insights might not be available for personal accounts
        if (errorData?.code === 100 || errorData?.message?.includes('Unsupported get request')) {
          return { data: [], error: 'Insights not available for this account type' };
        }
        throw new Error(`Instagram API error: ${errorData?.message || errorData}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Get account insights (for business accounts)
   */
  async getAccountInsights(accessToken, period = 'day', metrics = ['impressions', 'reach', 'profile_views']) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/insights`, {
        params: {
          metric: metrics.join(','),
          period: period,
          access_token: accessToken
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data.error;
        // Insights might not be available for personal accounts
        if (errorData?.code === 100 || errorData?.message?.includes('Unsupported get request')) {
          return { data: [], error: 'Insights not available for this account type' };
        }
        throw new Error(`Instagram API error: ${errorData?.message || errorData}`);
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Validate access token by making a test API call
   */
  async validateToken(accessToken) {
    try {
      const response = await this.getAccountInfo(accessToken);
      return {
        valid: true,
        data: response
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get token information and permissions
   */
  async getTokenInfo(accessToken) {
    try {
      // This endpoint might not be available for Instagram tokens
      // but we can try to get basic info to validate
      const accountInfo = await this.getAccountInfo(accessToken);
      
      return {
        valid: true,
        accountId: accountInfo.id,
        username: accountInfo.username,
        accountType: accountInfo.account_type,
        scopes: ['user_profile', 'user_media'], // Default scopes for Instagram Basic Display
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Test API connectivity and permissions
   */
  async testConnection(accessToken) {
    const tests = [];

    // Test 1: Basic account info
    try {
      const accountInfo = await this.getAccountInfo(accessToken);
      tests.push({
        test: 'Account Info',
        status: 'passed',
        data: accountInfo
      });
    } catch (error) {
      tests.push({
        test: 'Account Info',
        status: 'failed',
        error: error.message
      });
    }

    // Test 2: Media access
    try {
      const media = await this.getMedia(accessToken, 1);
      tests.push({
        test: 'Media Access',
        status: 'passed',
        data: { mediaCount: media.data?.length || 0 }
      });
    } catch (error) {
      tests.push({
        test: 'Media Access',
        status: 'failed',
        error: error.message
      });
    }

    // Test 3: Detailed account info (might fail for some account types)
    try {
      const detailedInfo = await this.getDetailedAccountInfo(accessToken);
      tests.push({
        test: 'Detailed Account Info',
        status: 'passed',
        data: { hasFollowersCount: !!detailedInfo.followers_count }
      });
    } catch (error) {
      tests.push({
        test: 'Detailed Account Info',
        status: 'warning',
        error: error.message
      });
    }

    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;

    return {
      overall: failedTests === 0 ? 'passed' : passedTests > 0 ? 'partial' : 'failed',
      tests,
      summary: {
        total: tests.length,
        passed: passedTests,
        failed: failedTests,
        warnings: tests.filter(t => t.status === 'warning').length
      }
    };
  }

  /**
   * Get rate limit information (if available)
   */
  async getRateLimitInfo(accessToken) {
    try {
      // Make a simple API call and check headers
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id',
          access_token: accessToken
        }
      });

      const headers = response.headers;
      
      return {
        available: true,
        limit: headers['x-ratelimit-limit'] || 'Unknown',
        remaining: headers['x-ratelimit-remaining'] || 'Unknown',
        reset: headers['x-ratelimit-reset'] || 'Unknown',
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Format media data for display
   */
  formatMediaData(media) {
    return {
      id: media.id,
      type: media.media_type,
      caption: media.caption ? media.caption.substring(0, 100) + (media.caption.length > 100 ? '...' : '') : 'No caption',
      url: media.permalink,
      timestamp: new Date(media.timestamp).toLocaleDateString(),
      likes: media.like_count || 'N/A',
      comments: media.comments_count || 'N/A'
    };
  }

  /**
   * Format account data for display
   */
  formatAccountData(account) {
    return {
      id: account.id,
      username: account.username,
      type: account.account_type || 'Personal',
      mediaCount: account.media_count || 0,
      followers: account.followers_count || 'N/A',
      following: account.follows_count || 'N/A',
      website: account.website || 'None',
      bio: account.biography ? account.biography.substring(0, 100) + (account.biography.length > 100 ? '...' : '') : 'No bio'
    };
  }
}

module.exports = InstagramAPI;