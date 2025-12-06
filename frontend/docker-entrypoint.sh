#!/bin/sh
set -e

# Define the root directory where the app is served
ROOT_DIR="/usr/share/nginx/html"

echo "Starting configuration substitution..."

# Function to traverse and replace in JS files
# We look for main app bundles where the strings would be embedded
# We use | as delimiter assuming values don't contain it.
# If they might, we should escape them, but simple substitution is usually enough for these keys.

replace_env() {
  local placeholder="$1"
  local value="$2"
  
  if [ -z "$value" ]; then
    echo "Warning: Environment variable for $placeholder is not set."
  else
    echo "Replacing $placeholder with provided value..."
    # Use find to locate JS files in assets/ (standard Vite output)
    # Recursively search in ROOT_DIR
    find "$ROOT_DIR" -type f -name "*.js" -exec sed -i "s|$placeholder|$value|g" {} +
  fi
}

replace_env "__APP_API_KEY__" "$API_KEY"
replace_env "__APP_RESEND_API_KEY__" "$RESEND_API_KEY"
replace_env "__APP_NOTIFICATION_EMAIL__" "$NOTIFICATION_EMAIL"
replace_env "__APP_BACKEND_URL__" "$BACKEND_URL"

# Generate nginx config from template using envsubst
# API_ORIGIN is used in the nginx template
echo "Generating Nginx configuration..."
envsubst '$API_ORIGIN' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Configuration complete. Starting Nginx..."
exec "$@"
