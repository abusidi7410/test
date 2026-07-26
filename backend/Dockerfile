FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy dependency files first for Docker layer caching
COPY composer.json composer.lock ./

# Install dependencies without source/scripts
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy the application source (vendor/ excluded by .dockerignore pattern if needed)
COPY . .

# Run post-install autoload and create directories
RUN composer dump-autoload --optimize --no-interaction && \
    mkdir -p storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache && \
    chmod +x entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]
