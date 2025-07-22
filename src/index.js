const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const open = require('open');

const OAuthManager = require('./oauth-manager');
const TokenManager = require('./token-manager');
const ConfigManager = require('./config-manager');
const InstagramAPI = require('./instagram-api');

class InstagramTokenCLI {
  constructor() {
    this.configDir = path.join(os.homedir(), '.instagram-cli');
    this.configManager = new ConfigManager(this.configDir);
    this.tokenManager = new TokenManager(this.configDir);
    this.oauthManager = new OAuthManager();
    this.instagramAPI = new InstagramAPI();
  }

  async init() {
    console.log(chalk.blue.bold('🚀 Instagram Token CLI Initialization\n'));
    
    // Ensure config directory exists
    await this.ensureConfigDir();
    
    // Check if already initialized
    const hasConfig = await this.configManager.hasConfig();
    if (hasConfig) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Configuration already exists. Do you want to overwrite it?',
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Initialization cancelled.'));
        return;
      }
    }

    console.log(chalk.cyan('Please provide your Facebook App credentials:'));
    console.log(chalk.gray('(You can find these in your Facebook Developer Console)\n'));

    const config = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Facebook App ID:',
        validate: (input) => input.trim() !== '' || 'App ID is required'
      },
      {
        type: 'password',
        name: 'appSecret',
        message: 'Facebook App Secret:',
        validate: (input) => input.trim() !== '' || 'App Secret is required'
      },
      {
        type: 'input',
        name: 'redirectUri',
        message: 'Redirect URI:',
        default: 'https://localhost:3000/auth/callback',
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      }
    ]);

    const spinner = ora('Saving configuration...').start();
    
    try {
      await this.configManager.saveConfig(config);
      spinner.succeed('Configuration saved successfully!');
      
      console.log(chalk.green('\n✅ Initialization complete!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(chalk.white('1. Run'), chalk.yellow('instagram-token add'), chalk.white('to add your first Instagram account'));
      console.log(chalk.white('2. Follow the OAuth flow to obtain your access token'));
      
    } catch (error) {
      spinner.fail('Failed to save configuration');
      throw error;
    }
  }

  async addAccount(alias) {
    console.log(chalk.blue.bold('📱 Adding Instagram Account\n'));
    
    // Check if initialized
    const hasConfig = await this.configManager.hasConfig();
    if (!hasConfig) {
      console.log(chalk.red('❌ Not initialized. Please run'), chalk.yellow('instagram-token init'), chalk.red('first.'));
      return;
    }

    // Get or prompt for alias
    if (!alias) {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'alias',
          message: 'Enter an alias for this account:',
          validate: (input) => {
            if (input.trim() === '') return 'Alias is required';
            if (!/^[a-zA-Z0-9_-]+$/.test(input)) return 'Alias can only contain letters, numbers, hyphens, and underscores';
            return true;
          }
        }
      ]);
      alias = response.alias;
    }

    // Check if alias already exists
    const accounts = await this.tokenManager.getAccounts();
    if (accounts[alias]) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Account "${alias}" already exists. Do you want to overwrite it?`,
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    try {
      const config = await this.configManager.getConfig();
      
      // Start Facebook OAuth flow for Instagram Graph API
      console.log(chalk.cyan('\n🔐 Starting Facebook OAuth flow for Instagram Graph API...\n'));
      console.log(chalk.yellow('Note: This will authenticate with Facebook to access your Instagram Business Account.'));
      
      const authUrl = this.oauthManager.generateAuthUrl(config);
      
      console.log(chalk.yellow('\n1. Open the following URL in your browser:'));
      console.log(chalk.blue.underline(authUrl));
      console.log();
      
      const { openBrowser } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openBrowser',
          message: 'Would you like me to open this URL in your browser?',
          default: true
        }
      ]);
      
      if (openBrowser) {
        await open(authUrl);
      }
      
      console.log(chalk.yellow('\n2. After authorizing, you will be redirected to your redirect URI.'));
      console.log(chalk.yellow('3. Copy the entire redirect URL from your browser address bar.'));
      
      const { redirectUrl } = await inquirer.prompt([
        {
          type: 'input',
          name: 'redirectUrl',
          message: 'Paste the redirect URL here:',
          validate: (input) => {
            try {
              const url = new URL(input);
              if (!url.searchParams.get('code')) {
                return 'URL must contain an authorization code parameter';
              }
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          }
        }
      ]);
      
      const spinner = ora('Exchanging authorization code for Facebook access token...').start();
      
      // Extract authorization code
      const code = new URL(redirectUrl).searchParams.get('code');
      
      // Exchange code for Facebook short-lived token
      const shortLivedToken = await this.oauthManager.exchangeCodeForToken(code, config);
      spinner.text = 'Converting to long-lived Facebook token...';
      
      // Exchange for long-lived Facebook token
      const longLivedToken = await this.oauthManager.exchangeForLongLivedToken(shortLivedToken, config);
      spinner.text = 'Fetching Facebook pages...';
      
      // Get user's Facebook pages
      const pages = await this.oauthManager.getFacebookPages(longLivedToken.access_token);
      
      if (pages.length === 0) {
        spinner.fail('No Facebook pages found');
        console.log(chalk.red('\n❌ No Facebook pages found.'));
        console.log(chalk.yellow('You need a Facebook page connected to your Instagram Business Account.'));
        console.log(chalk.cyan('Please create a Facebook page and connect it to your Instagram account first.'));
        return;
      }
      
      spinner.stop();
      
      // Let user select a Facebook page
      const { selectedPageId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPageId',
          message: 'Select the Facebook page connected to your Instagram account:',
          choices: pages.map(page => ({
            name: `${page.name} (ID: ${page.id})`,
            value: page.id
          }))
        }
      ]);
      
      const selectedPage = pages.find(p => p.id === selectedPageId);
      const spinner2 = ora('Getting Instagram Business Account information...').start();
      
      // Get Instagram Business Account from the selected page
      const instagramAccount = await this.oauthManager.getInstagramAccountFromPage(selectedPage.access_token, selectedPageId);
      
      if (!instagramAccount) {
        spinner2.fail('No Instagram Business Account found');
        console.log(chalk.red('\n❌ No Instagram Business Account found for this Facebook page.'));
        console.log(chalk.yellow('Please ensure your Instagram account is:'));
        console.log(chalk.white('1. Converted to a Business account'));
        console.log(chalk.white('2. Connected to the selected Facebook page'));
        return;
      }
      
      spinner2.text = 'Fetching Instagram account details...';
      
      // Get detailed Instagram account info using the Instagram Graph API
      const accountInfo = await this.instagramAPI.getAccountInfo(selectedPage.access_token, instagramAccount.id);
      
      // Save account with both Facebook and Instagram information
      await this.tokenManager.saveAccount(alias, {
        access_token: selectedPage.access_token, // Use page access token for Instagram Graph API
        token_type: 'bearer',
        expires_in: longLivedToken.expires_in,
        facebookUserId: longLivedToken.user_id || 'unknown',
        facebookPageId: selectedPageId,
        facebookPageName: selectedPage.name,
        instagramBusinessAccountId: instagramAccount.id,
        accountInfo,
        createdAt: new Date().toISOString(),
        lastRefreshed: new Date().toISOString()
      });
      
      spinner2.succeed(`Account "${alias}" added successfully!`);
      
      console.log(chalk.green('\n✅ Account Details:'));
      console.log(chalk.white(`   Alias: ${alias}`));
      console.log(chalk.white(`   Instagram Username: @${accountInfo.username}`));
      console.log(chalk.white(`   Instagram Account ID: ${instagramAccount.id}`));
      console.log(chalk.white(`   Facebook Page: ${selectedPage.name}`));
      console.log(chalk.white(`   Token expires: ${new Date(Date.now() + longLivedToken.expires_in * 1000).toLocaleDateString()}`));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to add account:'), error.message);
      throw error;
    }
  }

  async listAccounts() {
    console.log(chalk.blue.bold('📋 Instagram Accounts\n'));
    
    const accounts = await this.tokenManager.getAccounts();
    const accountList = Object.entries(accounts);
    
    if (accountList.length === 0) {
      console.log(chalk.yellow('No accounts found. Run'), chalk.cyan('instagram-token add'), chalk.yellow('to add an account.'));
      return;
    }
    
    const defaultAccount = await this.tokenManager.getDefaultAccount();
    
    console.log(chalk.cyan(`Found ${accountList.length} account(s):\n`));
    
    for (const [alias, account] of accountList) {
      const isDefault = alias === defaultAccount;
      const prefix = isDefault ? chalk.green('● ') : chalk.gray('○ ');
      const status = this.getTokenStatus(account);
      
      console.log(`${prefix}${chalk.white.bold(alias)} ${isDefault ? chalk.green('(default)') : ''}`);
      console.log(`   Username: @${account.accountInfo.username}`);
      console.log(`   Instagram Business Account ID: ${account.instagramBusinessAccountId}`);
      console.log(`   Facebook Page: ${account.facebookPageName}`);
      console.log(`   Status: ${status}`);
      console.log(`   Last refreshed: ${new Date(account.lastRefreshed).toLocaleDateString()}`);
      console.log();
    }
  }

  async useAccount(alias) {
    const accounts = await this.tokenManager.getAccounts();
    
    if (!accounts[alias]) {
      console.log(chalk.red(`❌ Account "${alias}" not found.`));
      console.log(chalk.yellow('Run'), chalk.cyan('instagram-token list'), chalk.yellow('to see available accounts.'));
      return;
    }
    
    await this.tokenManager.setDefaultAccount(alias);
    console.log(chalk.green(`✅ Default account set to "${alias}"`));
  }

  async getAccountInfo(alias) {
    const account = await this.getAccountByAlias(alias);
    if (!account) return;
    
    console.log(chalk.blue.bold(`📱 Account Information: ${account.alias}\n`));
    
    const status = this.getTokenStatus(account.data);
    const expiresAt = new Date(Date.now() + account.data.expires_in * 1000);
    
    console.log(chalk.cyan('Instagram Account Details:'));
    console.log(`   Alias: ${account.alias}`);
    console.log(`   Username: @${account.data.accountInfo.username}`);
    console.log(`   Name: ${account.data.accountInfo.name || 'N/A'}`);
    console.log(`   Instagram Business Account ID: ${account.data.instagramBusinessAccountId}`);
    console.log(`   Account Type: Business`);
    console.log();
    
    console.log(chalk.cyan('Facebook Integration:'));
    console.log(`   Facebook Page: ${account.data.facebookPageName}`);
    console.log(`   Facebook Page ID: ${account.data.facebookPageId}`);
    console.log();
    
    console.log(chalk.cyan('Token Information:'));
    console.log(`   Status: ${status}`);
    console.log(`   Expires: ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}`);
    console.log(`   Created: ${new Date(account.data.createdAt).toLocaleDateString()}`);
    console.log(`   Last Refreshed: ${new Date(account.data.lastRefreshed).toLocaleDateString()}`);
    console.log(`   Access Token: ${account.data.access_token.substring(0, 20)}...`);
  }

  async refreshToken(alias) {
    const account = await this.getAccountByAlias(alias);
    if (!account) return;
    
    console.log(chalk.blue.bold(`🔄 Refreshing Token: ${account.alias}\n`));
    
    const spinner = ora('Refreshing access token...').start();
    
    try {
      const config = await this.configManager.getConfig();
      const refreshedToken = await this.oauthManager.refreshLongLivedToken(account.data.access_token, config);
      
      // Update account data
      const updatedAccount = {
        ...account.data,
        ...refreshedToken,
        lastRefreshed: new Date().toISOString()
      };
      
      await this.tokenManager.saveAccount(account.alias, updatedAccount);
      
      spinner.succeed('Token refreshed successfully!');
      
      const expiresAt = new Date(Date.now() + refreshedToken.expires_in * 1000);
      console.log(chalk.green(`✅ New expiration: ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}`));
      
    } catch (error) {
      spinner.fail('Failed to refresh token');
      throw error;
    }
  }

  async removeAccount(alias) {
    const accounts = await this.tokenManager.getAccounts();
    
    if (!accounts[alias]) {
      console.log(chalk.red(`❌ Account "${alias}" not found.`));
      return;
    }
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to remove account "${alias}"?`,
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }
    
    await this.tokenManager.removeAccount(alias);
    console.log(chalk.green(`✅ Account "${alias}" removed successfully.`));
  }

  async exportData(file) {
    const defaultFile = `instagram-cli-backup-${new Date().toISOString().split('T')[0]}.json`;
    const exportFile = file || defaultFile;
    
    console.log(chalk.blue.bold('📤 Exporting Data\n'));
    
    const spinner = ora('Gathering data...').start();
    
    try {
      const config = await this.configManager.getConfig();
      const accounts = await this.tokenManager.getAccounts();
      const defaultAccount = await this.tokenManager.getDefaultAccount();
      
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        config: {
          appId: config.appId,
          redirectUri: config.redirectUri
          // Note: We don't export the app secret for security
        },
        accounts,
        defaultAccount
      };
      
      spinner.text = 'Writing export file...';
      await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
      
      spinner.succeed(`Data exported to ${exportFile}`);
      console.log(chalk.yellow('\n⚠️  Note: App secret was not exported for security reasons.'));
      console.log(chalk.yellow('You will need to reconfigure it after importing.'));
      
    } catch (error) {
      spinner.fail('Export failed');
      throw error;
    }
  }

  async importData(file) {
    console.log(chalk.blue.bold('📥 Importing Data\n'));
    
    try {
      const data = JSON.parse(await fs.readFile(file, 'utf8'));
      
      console.log(chalk.cyan(`Import file created: ${new Date(data.exportedAt).toLocaleDateString()}`));
      console.log(chalk.cyan(`Accounts to import: ${Object.keys(data.accounts).length}`));
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'This will overwrite existing data. Continue?',
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Import cancelled.'));
        return;
      }
      
      const spinner = ora('Importing data...').start();
      
      // Import accounts
      for (const [alias, account] of Object.entries(data.accounts)) {
        await this.tokenManager.saveAccount(alias, account);
      }
      
      // Set default account
      if (data.defaultAccount) {
        await this.tokenManager.setDefaultAccount(data.defaultAccount);
      }
      
      spinner.succeed('Data imported successfully!');
      console.log(chalk.yellow('\n⚠️  Remember to run'), chalk.cyan('instagram-token init'), chalk.yellow('to configure your app secret.'));
      
    } catch (error) {
      console.error(chalk.red('Import failed:'), error.message);
      throw error;
    }
  }

  // Helper methods
  async ensureConfigDir() {
    try {
      await fs.access(this.configDir);
    } catch {
      await fs.mkdir(this.configDir, { recursive: true });
    }
  }

  async getAccountByAlias(alias) {
    const accounts = await this.tokenManager.getAccounts();
    
    if (!alias) {
      const defaultAccount = await this.tokenManager.getDefaultAccount();
      if (!defaultAccount) {
        console.log(chalk.red('❌ No default account set. Please specify an alias or set a default account.'));
        return null;
      }
      alias = defaultAccount;
    }
    
    if (!accounts[alias]) {
      console.log(chalk.red(`❌ Account "${alias}" not found.`));
      console.log(chalk.yellow('Run'), chalk.cyan('instagram-token list'), chalk.yellow('to see available accounts.'));
      return null;
    }
    
    return { alias, data: accounts[alias] };
  }

  getTokenStatus(account) {
    const now = Date.now();
    const expiresAt = now + (account.expires_in * 1000);
    const daysUntilExpiry = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return chalk.red('Expired');
    } else if (daysUntilExpiry < 7) {
      return chalk.yellow(`Expires in ${daysUntilExpiry} days`);
    } else {
      return chalk.green(`Valid (${daysUntilExpiry} days remaining)`);
    }
  }
}

module.exports = InstagramTokenCLI;