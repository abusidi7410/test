#!/bin/sh
set -e

echo "================================================"
echo "      TechHub Backend - Railway Startup"
echo "================================================"
echo "ENTRYPOINT VERSION 2026-07-27-v3"
echo ""

# -------------------------------------------------
# 1. Create required directories
# -------------------------------------------------
echo "[1/7] Creating Laravel directories..."

mkdir -p \
    storage/app \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# -------------------------------------------------
# 2. Verify APP_KEY
# -------------------------------------------------
echo "[2/7] Checking application configuration..."

if [ -z "$APP_KEY" ]; then
    echo ""
    echo "ERROR: APP_KEY is missing."
    exit 1
fi

echo "APP_KEY found."

echo ""
echo "========== DATABASE CONFIG =========="
echo "APP_ENV=$APP_ENV"
echo "DB_CONNECTION=$DB_CONNECTION"
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"
echo "DB_DATABASE=$DB_DATABASE"
echo "DB_USERNAME=$DB_USERNAME"
echo "====================================="
echo ""

# -------------------------------------------------
# 3. Wait for database connection
# -------------------------------------------------
echo "[3/7] Waiting for database..."

MAX_RETRIES=30
RETRY_COUNT=0

until php artisan migrate:status >/dev/null 2>&1
do
    RETRY_COUNT=$((RETRY_COUNT + 1))

    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo ""
        echo "ERROR: Database connection failed."
        exit 1
    fi

    echo "Database not ready... retry $RETRY_COUNT/$MAX_RETRIES"
    sleep 2
done

echo "Database connection successful."

# -------------------------------------------------
# 4. Clear caches
# -------------------------------------------------
echo "[4/7] Clearing Laravel caches..."

php artisan optimize:clear || true

# -------------------------------------------------
# 5. Build caches
# -------------------------------------------------
echo "[5/7] Building caches..."

php artisan config:cache || true
php artisan route:cache || true

if [ -d resources/views ]; then
    php artisan view:cache || true
else
    echo "resources/views not found. Skipping view cache."
fi

# -------------------------------------------------
# 6. Fix permissions
# -------------------------------------------------
echo "[6/7] Fixing permissions..."

chmod -R 775 storage bootstrap/cache || true
chown -R www-data:www-data storage bootstrap/cache || true

# -------------------------------------------------
# 7. Run migrations
# -------------------------------------------------
echo "[7/7] Running migrations..."

php artisan migrate --force

echo ""
echo "================================================"
echo "Laravel startup completed successfully."
echo "Launching FrankenPHP..."
echo "================================================"

exec "$@"