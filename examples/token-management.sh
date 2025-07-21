#!/bin/bash

# Instagram Token Management Script
# This script demonstrates various token management operations

echo "🔐 Instagram Token Management Example"
echo "===================================="
echo

# Function to check if CLI is installed
check_cli() {
    if ! command -v instagram-token &> /dev/null; then
        echo "❌ Instagram Token CLI not found. Please install it first:"
        echo "   npm install -g instagram-token-cli"
        exit 1
    fi
}

# Function to check if initialized
check_init() {
    if ! instagram-token list &> /dev/null; then
        echo "❌ CLI not initialized. Please run:"
        echo "   instagram-token init"
        exit 1
    fi
}

# Function to refresh expiring tokens
refresh_expiring_tokens() {
    echo "🔄 Checking for expiring tokens..."
    
    # Get list of accounts with less than 7 days remaining
    expiring_accounts=$(instagram-token list --json 2>/dev/null | jq -r '.[] | select(.daysUntilExpiry < 7) | .alias' 2>/dev/null)
    
    if [ -z "$expiring_accounts" ]; then
        echo "✅ No tokens need refreshing"
        return
    fi
    
    echo "⚠️  Found expiring tokens:"
    echo "$expiring_accounts" | while read -r account; do
        echo "   - $account"
    done
    echo
    
    # Refresh each expiring token
    echo "$expiring_accounts" | while read -r account; do
        echo "🔄 Refreshing token for: $account"
        if instagram-token refresh "$account"; then
            echo "✅ Successfully refreshed: $account"
        else
            echo "❌ Failed to refresh: $account"
        fi
        echo
    done
}

# Function to backup tokens
backup_tokens() {
    echo "💾 Creating backup..."
    
    backup_file="instagram-tokens-backup-$(date +%Y%m%d-%H%M%S).json"
    
    if instagram-token export "$backup_file"; then
        echo "✅ Backup created: $backup_file"
        echo "📁 Location: $(pwd)/$backup_file"
    else
        echo "❌ Failed to create backup"
    fi
    echo
}

# Function to show token status
show_status() {
    echo "📊 Token Status Report"
    echo "====================="
    echo
    
    # Get account list
    if ! instagram-token list; then
        echo "❌ No accounts found or CLI not configured"
        return
    fi
    echo
    
    # Show detailed info for default account
    echo "🔍 Default Account Details:"
    echo "=========================="
    instagram-token info
    echo
}

# Function to validate all tokens
validate_tokens() {
    echo "✅ Validating all tokens..."
    echo
    
    # Get list of all accounts
    accounts=$(instagram-token list --json 2>/dev/null | jq -r '.[].alias' 2>/dev/null)
    
    if [ -z "$accounts" ]; then
        echo "❌ No accounts found"
        return
    fi
    
    echo "$accounts" | while read -r account; do
        echo "🔍 Validating: $account"
        
        # Get token and test it
        token=$(instagram-token info "$account" --token-only 2>/dev/null)
        
        if [ -n "$token" ]; then
            # Test API call
            response=$(curl -s "https://graph.instagram.com/me?fields=id,username&access_token=$token")
            
            if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
                username=$(echo "$response" | jq -r '.username')
                echo "✅ Valid: $account (@$username)"
            else
                echo "❌ Invalid: $account"
                echo "   Error: $(echo "$response" | jq -r '.error.message // "Unknown error"')"
            fi
        else
            echo "❌ No token found for: $account"
        fi
        echo
    done
}

# Main menu
show_menu() {
    echo "Choose an operation:"
    echo "1) Show token status"
    echo "2) Refresh expiring tokens"
    echo "3) Validate all tokens"
    echo "4) Create backup"
    echo "5) Run all checks"
    echo "6) Exit"
    echo
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1) show_status ;;
        2) refresh_expiring_tokens ;;
        3) validate_tokens ;;
        4) backup_tokens ;;
        5) 
            show_status
            echo
            refresh_expiring_tokens
            echo
            validate_tokens
            echo
            backup_tokens
            ;;
        6) echo "👋 Goodbye!"; exit 0 ;;
        *) echo "❌ Invalid choice. Please try again."; echo ;;
    esac
}

# Main execution
main() {
    check_cli
    check_init
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            echo
            read -p "Press Enter to continue or Ctrl+C to exit..."
            echo
        done
    else
        # Command line mode
        case $1 in
            "status") show_status ;;
            "refresh") refresh_expiring_tokens ;;
            "validate") validate_tokens ;;
            "backup") backup_tokens ;;
            "all") 
                show_status
                echo
                refresh_expiring_tokens
                echo
                validate_tokens
                echo
                backup_tokens
                ;;
            *) 
                echo "Usage: $0 [status|refresh|validate|backup|all]"
                echo "   Or run without arguments for interactive mode"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"