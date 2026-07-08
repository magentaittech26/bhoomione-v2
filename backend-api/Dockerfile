# Use php:8.3-fpm-alpine as the base image
FROM php:8.3-fpm-alpine

# Install system utilities and build dependencies
RUN apk update && apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    zlib-dev \
    libzip-dev \
    postgresql-dev \
    oniguruma-dev \
    icu-dev \
    icu-libs \
    unzip \
    bash

# Add docker-php-extension-installer script
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

RUN chmod +x /usr/local/bin/install-php-extensions

# Install required PHP extensions for Laravel + PostgreSQL
RUN install-php-extensions \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    bcmath \
    intl \
    zip \
    gd \
    exif \
    pcntl \
    redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy custom PHP configuration
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Set working directory inside the container
WORKDIR /var/www/html

# Copy Composer files first if they exist to leverage Docker layer caching
COPY composer.json* composer.lock* /var/www/html/

# Install production dependencies if composer.json is present
RUN if [ -f "composer.json" ]; then \
        composer update --no-interaction --no-dev --optimize-autoloader --prefer-dist; \
    fi

# Copy all application files to the container
COPY . /var/www/html/

# Copy the entrypoint script to /usr/local/bin so it remains unaffected by host volume mounts over /var/www/html
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create appropriate Laravel storage and bootstrap folders and set correct user/group permissions
RUN mkdir -p /var/www/html/storage/framework/cache/data \
             /var/www/html/storage/framework/sessions \
             /var/www/html/storage/framework/views \
             /var/www/html/storage/logs \
             /var/www/html/bootstrap/cache && \
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Expose PHP-FPM default port
EXPOSE 9000

# Set entrypoint and default execution command
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm"]
