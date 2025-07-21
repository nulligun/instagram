const fs = require('fs').promises;
const path = require('path');
const keytar = require('keytar');

class TokenManager {
  constructor(configDir) {
    this.configDir = configDir;
    this.accountsFile = path.join(configDir, 'accounts.json');
    this.settingsFile = path.join(configDir, 'settings.json');
    this.serviceName = 'instagram-token-cli';
  }

  /**
   * Save account with encrypted token storage
   */
  async saveAccount(alias, accountData) {
    try {
      // Store sensitive token data in keychain
      await keytar.setPassword(this.serviceName, `${alias}-token`, accountData.access_token);
      
      // Store non-sensitive data in JSON file
      const accounts = await this.getAccounts();
      accounts[alias] = {
        accountInfo: accountData.accountInfo,
        token_type: accountData.token_type,
        expires_in: accountData.expires_in,
        createdAt: accountData.createdAt,
        lastRefreshed: accountData.lastRefreshed,
        // Store a hash of the token for validation without exposing it
        tokenHash: this.hashToken(accountData.access_token)
      };

      await this.saveAccountsFile(accounts);
      
      // Set as default if it's the first account
      const accountList = Object.keys(accounts);
      if (accountList.length === 1) {
        await this.setDefaultAccount(alias);
      }
      
    } catch (error) {
      throw new Error(`Failed to save account: ${error.message}`);
    }
  }

  /**
   * Get account data with decrypted token
   */
  async getAccount(alias) {
    try {
      const accounts = await this.getAccounts();
      const account = accounts[alias];
      
      if (!account) {
        return null;
      }

      // Retrieve token from keychain
      const accessToken = await keytar.getPassword(this.serviceName, `${alias}-token`);
      
      if (!accessToken) {
        throw new Error(`Token not found in secure storage for account: ${alias}`);
      }

      // Verify token integrity
      if (this.hashToken(accessToken) !== account.tokenHash) {
        throw new Error(`Token integrity check failed for account: ${alias}`);
      }

      return {
        ...account,
        access_token: accessToken
      };
    } catch (error) {
      throw new Error(`Failed to retrieve account: ${error.message}`);
    }
  }

  /**
   * Get all accounts (without tokens for security)
   */
  async getAccounts() {
    try {
      await fs.access(this.accountsFile);
      const data = await fs.readFile(this.accountsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw new Error(`Failed to read accounts: ${error.message}`);
    }
  }

  /**
   * Get all accounts with their tokens (for operations that need them)
   */
  async getAccountsWithTokens() {
    const accounts = await this.getAccounts();
    const accountsWithTokens = {};

    for (const alias of Object.keys(accounts)) {
      accountsWithTokens[alias] = await this.getAccount(alias);
    }

    return accountsWithTokens;
  }

  /**
   * Remove account and its stored token
   */
  async removeAccount(alias) {
    try {
      const accounts = await this.getAccounts();
      
      if (!accounts[alias]) {
        throw new Error(`Account ${alias} not found`);
      }

      // Remove from keychain
      await keytar.deletePassword(this.serviceName, `${alias}-token`);
      
      // Remove from accounts file
      delete accounts[alias];
      await this.saveAccountsFile(accounts);

      // Update default account if necessary
      const defaultAccount = await this.getDefaultAccount();
      if (defaultAccount === alias) {
        const remainingAccounts = Object.keys(accounts);
        if (remainingAccounts.length > 0) {
          await this.setDefaultAccount(remainingAccounts[0]);
        } else {
          await this.clearDefaultAccount();
        }
      }
    } catch (error) {
      throw new Error(`Failed to remove account: ${error.message}`);
    }
  }

  /**
   * Set default account
   */
  async setDefaultAccount(alias) {
    try {
      const accounts = await this.getAccounts();
      
      if (!accounts[alias]) {
        throw new Error(`Account ${alias} not found`);
      }

      const settings = await this.getSettings();
      settings.defaultAccount = alias;
      await this.saveSettings(settings);
    } catch (error) {
      throw new Error(`Failed to set default account: ${error.message}`);
    }
  }

  /**
   * Get default account alias
   */
  async getDefaultAccount() {
    try {
      const settings = await this.getSettings();
      return settings.defaultAccount || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear default account
   */
  async clearDefaultAccount() {
    try {
      const settings = await this.getSettings();
      delete settings.defaultAccount;
      await this.saveSettings(settings);
    } catch (error) {
      throw new Error(`Failed to clear default account: ${error.message}`);
    }
  }

  /**
   * Check if account exists
   */
  async hasAccount(alias) {
    const accounts = await this.getAccounts();
    return accounts.hasOwnProperty(alias);
  }

  /**
   * Get account count
   */
  async getAccountCount() {
    const accounts = await this.getAccounts();
    return Object.keys(accounts).length;
  }

  /**
   * Validate stored tokens
   */
  async validateStoredTokens() {
    const accounts = await this.getAccounts();
    const results = {};

    for (const alias of Object.keys(accounts)) {
      try {
        const account = await this.getAccount(alias);
        const now = Date.now();
        const expiresAt = now + (account.expires_in * 1000);
        
        results[alias] = {
          valid: true,
          expired: expiresAt < now,
          expiresAt: new Date(expiresAt),
          daysUntilExpiry: Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24))
        };
      } catch (error) {
        results[alias] = {
          valid: false,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    const validation = await this.validateStoredTokens();
    const expiredAccounts = [];

    for (const [alias, result] of Object.entries(validation)) {
      if (result.valid && result.expired) {
        expiredAccounts.push(alias);
      }
    }

    for (const alias of expiredAccounts) {
      await this.removeAccount(alias);
    }

    return expiredAccounts;
  }

  /**
   * Export account data (without tokens for security)
   */
  async exportAccounts() {
    const accounts = await this.getAccounts();
    const settings = await this.getSettings();
    
    return {
      accounts,
      defaultAccount: settings.defaultAccount,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import account data (tokens must be added separately)
   */
  async importAccounts(data) {
    await this.saveAccountsFile(data.accounts);
    
    if (data.defaultAccount) {
      await this.setDefaultAccount(data.defaultAccount);
    }
  }

  // Private helper methods

  /**
   * Save accounts file
   */
  async saveAccountsFile(accounts) {
    await fs.writeFile(this.accountsFile, JSON.stringify(accounts, null, 2));
  }

  /**
   * Get settings
   */
  async getSettings() {
    try {
      await fs.access(this.settingsFile);
      const data = await fs.readFile(this.settingsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw new Error(`Failed to read settings: ${error.message}`);
    }
  }

  /**
   * Save settings
   */
  async saveSettings(settings) {
    await fs.writeFile(this.settingsFile, JSON.stringify(settings, null, 2));
  }

  /**
   * Create a hash of the token for integrity checking
   */
  hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get all stored credentials from keychain (for debugging)
   */
  async getStoredCredentials() {
    try {
      const credentials = await keytar.findCredentials(this.serviceName);
      return credentials.map(cred => ({
        account: cred.account,
        hasPassword: !!cred.password
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all stored credentials (for cleanup)
   */
  async clearAllCredentials() {
    try {
      const credentials = await keytar.findCredentials(this.serviceName);
      
      for (const cred of credentials) {
        await keytar.deletePassword(this.serviceName, cred.account);
      }
      
      return credentials.length;
    } catch (error) {
      throw new Error(`Failed to clear credentials: ${error.message}`);
    }
  }
}

module.exports = TokenManager;