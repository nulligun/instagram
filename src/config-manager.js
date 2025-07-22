const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
  constructor(configDir) {
    this.configDir = configDir;
    this.configFile = path.join(configDir, 'config.json');
  }

  /**
   * Save configuration with app secret in plain text
   */
  async saveConfig(config) {
    try {
      // Store all config data including app secret in JSON file
      const configData = {
        appId: config.appId,
        appSecret: config.appSecret,
        redirectUri: config.redirectUri,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.configFile, JSON.stringify(configData, null, 2));
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Get configuration with app secret
   */
  async getConfig() {
    try {
      // Check if config file exists
      await fs.access(this.configFile);
      
      // Read config file
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      if (!config.appSecret) {
        throw new Error('App secret not found in configuration. Please run initialization again.');
      }

      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Configuration not found. Please run "instagram-token init" first.');
      }
      throw new Error(`Failed to read configuration: ${error.message}`);
    }
  }

  /**
   * Check if configuration exists
   */
  async hasConfig() {
    try {
      await fs.access(this.configFile);
      
      // Check if app secret exists in config file
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      return !!(config.appSecret);
    } catch (error) {
      return false;
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(updates) {
    try {
      const currentConfig = await this.getConfig();
      
      // Update config file with all data including appSecret
      const updatedConfig = {
        ...currentConfig,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.configFile, JSON.stringify(updatedConfig, null, 2));
    } catch (error) {
      throw new Error(`Failed to update configuration: ${error.message}`);
    }
  }

  /**
   * Remove configuration
   */
  async removeConfig() {
    try {
      // Remove config file
      await fs.unlink(this.configFile);
    } catch (error) {
      // Don't throw error if files don't exist
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to remove configuration: ${error.message}`);
      }
    }
  }

  /**
   * Validate configuration
   */
  async validateConfig() {
    try {
      const config = await this.getConfig();
      
      const errors = [];
      
      // Validate App ID
      if (!config.appId || typeof config.appId !== 'string' || config.appId.trim() === '') {
        errors.push('App ID is missing or invalid');
      }
      
      // Validate App Secret
      if (!config.appSecret || typeof config.appSecret !== 'string' || config.appSecret.trim() === '') {
        errors.push('App Secret is missing or invalid');
      }
      
      // Validate Redirect URI
      if (!config.redirectUri || typeof config.redirectUri !== 'string') {
        errors.push('Redirect URI is missing');
      } else {
        try {
          new URL(config.redirectUri);
        } catch {
          errors.push('Redirect URI is not a valid URL');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        config: errors.length === 0 ? config : null
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        config: null
      };
    }
  }

  /**
   * Get configuration info (without sensitive data)
   */
  async getConfigInfo() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      return {
        appId: config.appId,
        redirectUri: config.redirectUri,
        createdAt: config.createdAt,
        lastUpdated: config.lastUpdated,
        hasAppSecret: await this.hasAppSecret()
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to read configuration info: ${error.message}`);
    }
  }

  /**
   * Check if app secret exists in configuration
   */
  async hasAppSecret() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      return !!(config.appSecret);
    } catch (error) {
      return false;
    }
  }

  /**
   * Export configuration (without app secret for security)
   */
  async exportConfig() {
    try {
      const configInfo = await this.getConfigInfo();
      
      if (!configInfo) {
        return null;
      }
      
      return {
        appId: configInfo.appId,
        redirectUri: configInfo.redirectUri,
        createdAt: configInfo.createdAt,
        lastUpdated: configInfo.lastUpdated,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to export configuration: ${error.message}`);
    }
  }

  /**
   * Import configuration (app secret must be set separately)
   */
  async importConfig(configData) {
    try {
      const config = {
        appId: configData.appId,
        redirectUri: configData.redirectUri,
        createdAt: configData.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error.message}`);
    }
  }

  /**
   * Reset configuration (for troubleshooting)
   */
  async resetConfig() {
    try {
      await this.removeConfig();
      console.log('Configuration reset successfully. Please run "instagram-token init" to reconfigure.');
    } catch (error) {
      throw new Error(`Failed to reset configuration: ${error.message}`);
    }
  }

  /**
   * Get Facebook App URLs for reference
   */
  getFacebookAppUrls(appId) {
    return {
      dashboard: `https://developers.facebook.com/apps/${appId}/dashboard/`,
      settings: `https://developers.facebook.com/apps/${appId}/settings/basic/`,
      products: `https://developers.facebook.com/apps/${appId}/add/`,
      instagram: `https://developers.facebook.com/apps/${appId}/instagram-basic-display/basic-display/`,
      permissions: `https://developers.facebook.com/apps/${appId}/app-review/permissions/`
    };
  }

  /**
   * Generate recommended redirect URIs
   */
  generateRedirectUris() {
    return [
      'https://localhost:3000/auth/callback',
      'http://localhost:3000/auth/callback',
      'https://127.0.0.1:3000/auth/callback',
      'http://127.0.0.1:3000/auth/callback'
    ];
  }

  /**
   * Validate redirect URI format
   */
  validateRedirectUri(uri) {
    try {
      const url = new URL(uri);
      
      const errors = [];
      
      // Check protocol
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('Redirect URI must use HTTP or HTTPS protocol');
      }
      
      // Recommend HTTPS for production
      if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
        errors.push('HTTPS is recommended for production redirect URIs');
      }
      
      // Check for common issues
      if (url.pathname === '/') {
        errors.push('Consider using a specific callback path like /auth/callback');
      }
      
      return {
        valid: errors.length === 0,
        warnings: errors.filter(e => e.includes('recommend')),
        errors: errors.filter(e => !e.includes('recommend')),
        parsed: {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname
        }
      };
    } catch (error) {
      return {
        valid: false,
        warnings: [],
        errors: ['Invalid URL format'],
        parsed: null
      };
    }
  }
}

module.exports = ConfigManager;