<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer Autoloader...
if (file_exists($composer = __DIR__.'/../vendor/autoload.php')) {
    require $composer;
} else {
    echo "Composer dependencies are not installed. Run composer install.\n";
    exit(1);
}

// Run the application...
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
