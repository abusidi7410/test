#!/bin/sh
set -e

echo "============================================"
echo "  TechHub Backend - Starting Up"
echo "============================================"

# -----------------------------------------------
# 1. Create required directories
# -----------------------------------------------
echo "[1/7] Creating directories..."
mkdir -p storage/app \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# -----------------------------------------------
# 2. Generate APP_KEY if missing
# -----------------------------------------------
echo "[2/7] Checking APP_KEY..."
if [ -z "$APP_KEY" ]; then
    echo "  WARNING: APP_KEY is not set. Generating a temporary key..."
    php artisan key:generate --force
    echo "  Set APP_KEY in Railway environment for persistence across restarts."
fi

# -----------------------------------------------
# 3. Wait for database
# -----------------------------------------------
echo "[3/7] Waiting for database..."
MAX_RETRIES=30
RETRY_COUNT=0
until php artisan migrate:status --no-interaction > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "  WARNING: Database not ready after $MAX_RETRIES attempts. Continuing anyway..."
        break
    fi
    echo "  Database not ready, retrying in 2s... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
if [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; then
    echo "  Database connected successfully."
fi

# -----------------------------------------------
# 4. Clear old caches (must clear before re-caching)
# -----------------------------------------------
echo "[4/7] Clearing old caches..."
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true

# -----------------------------------------------
# 5. Cache configuration and routes
# -----------------------------------------------
echo "[5/7] Caching configuration..."
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

# -----------------------------------------------
# 6. Fix permissions after all writes are complete
# -----------------------------------------------
echo "[6/7] Fixing permissions..."
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# -----------------------------------------------
# 7. Run migrations
# -----------------------------------------------
echo "[7/7] Running migrations..."
php artisan migrate --force 2>/dev/null || true

echo "============================================"
echo "  Startup complete. Launching server..."
echo "============================================"

# Execute the CMD (frankenphp for web, schedule:work for cron)
exec "$@"
