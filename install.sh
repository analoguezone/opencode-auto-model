#!/bin/bash

# OpenCode Orchestrator Plugin Installation Script
# This script installs the orchestrator plugin globally or per-project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running in a git repository
is_git_repo() {
    git rev-parse --git-dir > /dev/null 2>&1
}

# Main installation function
install() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   OpenCode Orchestrator Plugin Installer              ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""

    # Ask for installation type
    echo "Select installation type:"
    echo "  1) Global installation (all OpenCode projects)"
    echo "  2) Project installation (current directory only)"
    echo ""
    read -p "Enter choice [1-2]: " choice

    case $choice in
        1)
            install_global
            ;;
        2)
            install_project
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac

    # Ask about configuration
    echo ""
    echo "Select configuration template:"
    echo "  1) Generic example (default models)"
    echo "  2) User-optimized (GPT-5 Codex + Claude + GLM)"
    echo "  3) Skip configuration (I'll create my own)"
    echo ""
    read -p "Enter choice [1-3]: " config_choice

    case $config_choice in
        1)
            install_config "orchestrator.config.example.md" "$INSTALL_PATH"
            ;;
        2)
            install_config "orchestrator.config.user-example.md" "$INSTALL_PATH"
            ;;
        3)
            print_info "Skipping configuration. You can create your own later."
            ;;
        *)
            print_warning "Invalid choice. Skipping configuration."
            ;;
    esac

    # Install dependencies
    echo ""
    print_info "Installing dependencies..."

    if command -v bun &> /dev/null; then
        print_info "Using Bun..."
        bun add yaml
    elif command -v npm &> /dev/null; then
        print_info "Using npm..."
        npm install yaml
    else
        print_error "Neither bun nor npm found. Please install dependencies manually:"
        echo "  npm install yaml"
        echo "  # or"
        echo "  bun add yaml"
    fi

    print_success "Dependencies installed!"

    # Final instructions
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Installation Complete!                               ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    print_success "Plugin installed successfully!"
    echo ""
    print_info "Next steps:"
    echo "  1. Review and customize your configuration:"
    echo "     ${INSTALL_PATH}/orchestrator.config.md"
    echo ""
    echo "  2. Restart OpenCode or start a new session"
    echo ""
    echo "  3. The orchestrator will automatically analyze and select models"
    echo ""
    print_info "For more information, see README.md"
    echo ""
}

# Install globally
install_global() {
    INSTALL_PATH="$HOME/.config/opencode"
    PLUGIN_PATH="$INSTALL_PATH/plugin"

    print_info "Installing globally to: $INSTALL_PATH"

    # Create directories
    mkdir -p "$PLUGIN_PATH"
    print_success "Created plugin directory"

    # Copy plugin file
    if [ -f "orchestrator.plugin.ts" ]; then
        cp orchestrator.plugin.ts "$PLUGIN_PATH/"
        print_success "Copied plugin file"
    else
        print_error "orchestrator.plugin.ts not found in current directory"
        exit 1
    fi

    # Copy types if they exist
    if [ -f "types.d.ts" ]; then
        cp types.d.ts "$PLUGIN_PATH/"
        print_success "Copied type definitions"
    fi
}

# Install per-project
install_project() {
    if ! is_git_repo; then
        print_warning "Not in a git repository. Are you sure you want to continue?"
        read -p "Continue? [y/N]: " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            print_info "Installation cancelled."
            exit 0
        fi
    fi

    INSTALL_PATH=".opencode"
    PLUGIN_PATH="$INSTALL_PATH/plugin"

    print_info "Installing to project: $PWD/$INSTALL_PATH"

    # Create directories
    mkdir -p "$PLUGIN_PATH"
    print_success "Created plugin directory"

    # Copy plugin file
    if [ -f "orchestrator.plugin.ts" ]; then
        cp orchestrator.plugin.ts "$PLUGIN_PATH/"
        print_success "Copied plugin file"
    else
        print_error "orchestrator.plugin.ts not found in current directory"
        exit 1
    fi

    # Copy types if they exist
    if [ -f "types.d.ts" ]; then
        cp types.d.ts "$PLUGIN_PATH/"
        print_success "Copied type definitions"
    fi
}

# Install configuration
install_config() {
    local config_file=$1
    local install_path=$2

    if [ -f "$config_file" ]; then
        # Check if config already exists
        if [ -f "$install_path/orchestrator.config.md" ]; then
            print_warning "Configuration file already exists."
            read -p "Overwrite? [y/N]: " overwrite
            if [[ ! $overwrite =~ ^[Yy]$ ]]; then
                print_info "Keeping existing configuration."
                return
            fi
        fi

        cp "$config_file" "$install_path/orchestrator.config.md"
        print_success "Installed configuration: $config_file"
        print_info "Please review and customize the configuration file!"
    else
        print_error "Configuration file not found: $config_file"
    fi
}

# Run installation
install
