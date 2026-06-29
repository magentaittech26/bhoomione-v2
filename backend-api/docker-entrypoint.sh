#!/bin/sh
set -e

# Ensure Laravel storage and bootstrap/cache directories exist
echo "Initializing Laravel storage and cache directories..."
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

# Ensure PHP-FPM user (www-data) has full write privileges
echo "Applying directory ownership and permission hardening..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Execute the main container payload (such as php-fpm)
echo "Starting PHP-FPM server..."
exec "$@"
