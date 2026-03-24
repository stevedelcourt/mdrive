#!/bin/bash
# CloudLinux Node.js Selector Setup Script

APP_DIR="$HOME/apps/mdrive"

echo "Setting up CloudLinux Node.js environment for mdrive..."

cd "$APP_DIR"

# Create nodevenv directory
mkdir -p "$HOME/nodevenv"

# Install dependencies to nodevenv
"$HOME/nodevenv/bin/python3" -m venv nodevenv 2>/dev/null || true

# Install Node.js dependencies globally in a way CloudLinux expects
# CloudLinux will handle the nodevenv automatically

# Create the symlink structure if needed
if [ ! -L "$APP_DIR/node_modules" ]; then
    ln -sf "$HOME/nodevenv/lib/node_modules" "$APP_DIR/node_modules" 2>/dev/null || true
fi

echo "Setup complete!"
echo "Now use Node.js Selector with:"
echo "  - Application URL: mdrive.sc2bovu7233.universe.wf"
echo "  - Application Root: $APP_DIR"
