<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'BhoomiOne V2 API REST Portal',
        'status' => 'ONLINE',
        'version' => '2.0.0-staging'
    ]);
});
