<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\ProjectController;
use App\Http\Controllers\Api\v1\LayoutController;
use App\Http\Controllers\Api\v1\PlotController;
use App\Http\Controllers\Api\v1\DxfController;
use App\Http\Middleware\TenantResolverMiddleware;
use App\Http\Middleware\PermissionRequirementMiddleware;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
|
*/

Route::prefix('v1')->group(function () {

    // Dynamic Tenant Resolution middleware wrapping auth/tenant routes
    Route::middleware([TenantResolverMiddleware::class])->group(function () {
        Route::post('/auth/tenant/login', [AuthController::class, 'tenantLogin']);
    });

    // Global admin authenticate and generic identity access sessions
    Route::post('/auth/admin/login', [AuthController::class, 'adminLogin']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/password-reset/request', [AuthController::class, 'requestPasswordReset']);
    Route::post('/auth/password-reset/submit', [AuthController::class, 'submitPasswordReset']);

    // Protected current security user state
    Route::get('/me', [AuthController::class, 'me']);

    // System metrics health monitor
    Route::get('/system/health', function () {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $dbStatus = 'CONNECTED';
            $dbError = null;
        } catch (\Throwable $e) {
            $dbStatus = 'DISCONNECTED';
            $dbError = $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
        }

        return response()->json([
            'status' => $dbStatus === 'CONNECTED' ? 'OK' : 'DEGRADED',
            'timestamp' => now()->toIso8601String(),
            'database' => $dbStatus,
            'databaseError' => $dbError,
            'environmentStatus' => $dbStatus === 'CONNECTED' ? 'OPERATIONAL' : 'DEGRADED',
        ]);
    });

    // -------------------------------------------------------------------------
    // DYNAMIC DATABASE-DRIVEN RBAC PROTECTED ENDPOINTS (Sprint 1C Demo)
    // -------------------------------------------------------------------------

    // Platform-level route checking for platform-level permission
    Route::get('/admin/audit-logs', function () {
        return response()->json([
            'message' => 'Access authorized. Retrieved platform security logs from DB successfully.',
            'scope' => 'GLOBAL',
            'timestamp' => now()->toIso8601String()
        ]);
    })->middleware([PermissionRequirementMiddleware::class . ':audit.view']);

    Route::post('/admin/tenants', function (Request $request) {
        return response()->json([
            'message' => 'Access authorized. Created new tenant registry entry successfully.',
            'scope' => 'GLOBAL',
            'timestamp' => now()->toIso8601String()
        ]);
    })->middleware([PermissionRequirementMiddleware::class . ':tenants.manage']);

    // Tenant-level route checking for tenant-level permission
    Route::get('/tenant/users', function () {
        return response()->json([
            'message' => 'Access authorized. Retrieved current workspace active member roster.',
            'scope' => 'TENANT',
            'timestamp' => now()->toIso8601String()
        ]);
    })->middleware([TenantResolverMiddleware::class, PermissionRequirementMiddleware::class . ':users.view']);

    // -------------------------------------------------------------------------
    // LAND INVENTORY MANAGEMENT WORKFLOWS (Sprint 2A Laravel Core)
    // -------------------------------------------------------------------------

    Route::middleware([TenantResolverMiddleware::class])->group(function () {
        // Projects Group
        Route::get('/projects', [ProjectController::class, 'index'])->middleware([PermissionRequirementMiddleware::class . ':projects.view']);
        Route::get('/projects/{id}', [ProjectController::class, 'show'])->middleware([PermissionRequirementMiddleware::class . ':projects.view']);
        Route::post('/projects', [ProjectController::class, 'store'])->middleware([PermissionRequirementMiddleware::class . ':projects.manage']);
        Route::put('/projects/{id}', [ProjectController::class, 'update'])->middleware([PermissionRequirementMiddleware::class . ':projects.manage']);
        Route::delete('/projects/{id}', [ProjectController::class, 'destroy'])->middleware([PermissionRequirementMiddleware::class . ':projects.manage']);

        // Layouts Group
        Route::get('/layouts', [LayoutController::class, 'index'])->middleware([PermissionRequirementMiddleware::class . ':layouts.view']);
        Route::get('/layouts/{id}', [LayoutController::class, 'show'])->middleware([PermissionRequirementMiddleware::class . ':layouts.view']);
        Route::post('/layouts', [LayoutController::class, 'store'])->middleware([PermissionRequirementMiddleware::class . ':layouts.manage']);
        Route::put('/layouts/{id}', [LayoutController::class, 'update'])->middleware([PermissionRequirementMiddleware::class . ':layouts.manage']);
        Route::delete('/layouts/{id}', [LayoutController::class, 'destroy'])->middleware([PermissionRequirementMiddleware::class . ':layouts.manage']);

        // Plots Group
        Route::get('/plots', [PlotController::class, 'index'])->middleware([PermissionRequirementMiddleware::class . ':plots.view']);
        Route::get('/plots/{id}', [PlotController::class, 'show'])->middleware([PermissionRequirementMiddleware::class . ':plots.view']);
        Route::post('/plots', [PlotController::class, 'store'])->middleware([PermissionRequirementMiddleware::class . ':plots.manage']);
        Route::put('/plots/{id}', [PlotController::class, 'update'])->middleware([PermissionRequirementMiddleware::class . ':plots.manage']);
        Route::delete('/plots/{id}', [PlotController::class, 'destroy'])->middleware([PermissionRequirementMiddleware::class . ':plots.manage']);

        // Measurement Units
        Route::get('/measurement-units', function () {
            return response()->json(\App\Models\MeasurementUnit::all());
        })->middleware([PermissionRequirementMiddleware::class . ':projects.view']);

        // DXF Group
        Route::get('/dxf/files', [DxfController::class, 'listFiles'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
        Route::get('/dxf/jobs', [DxfController::class, 'listJobs'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
        Route::get('/dxf/jobs/{id}', [DxfController::class, 'getJob'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
        Route::get('/dxf/jobs/{id}/review', [DxfController::class, 'getJobReview'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
        Route::post('/dxf/jobs/{id}/dispatch', [DxfController::class, 'dispatchJobGeneration'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
        Route::post('/dxf/generation-batches/{id}/rollback', [DxfController::class, 'rollbackBatch'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
        Route::post('/dxf/generation-batches/{id}/compile-svg', [DxfController::class, 'compileSvgDocument'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
        Route::get('/dxf/svg-documents/{id}', [DxfController::class, 'getSvgDocument'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
        Route::get('/dxf/style-profiles', [DxfController::class, 'getStyleProfiles'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
        Route::post('/dxf/upload', [DxfController::class, 'upload'])->middleware([PermissionRequirementMiddleware::class . ':dxf.upload']);
        Route::post('/dxf/mappings', [DxfController::class, 'saveMappings'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
        Route::post('/dxf/process', [DxfController::class, 'approveMapping'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
        Route::post('/dxf/templates', [DxfController::class, 'storeTemplate'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
        Route::get('/dxf/templates', [DxfController::class, 'listTemplates'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
        Route::delete('/dxf/templates/{id}', [DxfController::class, 'destroyTemplate'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
    });

});

