<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create developer_profiles table
        Schema::create('developer_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id')->unique();
            $table->string('company_name', 255);
            $table->string('logo', 255)->nullable();
            $table->string('cover_image', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('rera_number', 100)->nullable();
            $table->string('office_address', 255)->nullable();
            $table->string('website', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email', 255)->nullable();
            $table->jsonb('social_links')->default('{}');
            $table->integer('completed_projects')->default(0);
            $table->integer('active_projects')->default(0);
            $table->integer('years_in_business')->default(0);
            $table->string('verification_status', 50)->default('PENDING');
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->string('seo_slug', 255)->unique();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // 2. Add marketplace columns to projects table
        Schema::table('projects', function (Blueprint $table) {
            $table->string('publishing_status', 50)->default('Draft');
            $table->boolean('is_featured')->default(false);
            $table->jsonb('seo_settings')->default('{}');
            $table->string('moderation_status', 50)->default('PENDING');
            $table->jsonb('moderation_history')->default('[]');
            $table->integer('views_count')->default(0);
        });

        // 3. Add marketplace columns to layouts table
        Schema::table('layouts', function (Blueprint $table) {
            $table->string('visibility', 50)->default('Private');
            $table->string('price_range', 100)->nullable();
            $table->integer('downloads_count')->default(0);
        });

        // 4. Add marketplace columns to plots table
        Schema::table('plots', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->default(0.00);
            $table->boolean('marketplace_visible')->default(true);
            $table->string('booking_status', 50)->default('AVAILABLE');
            $table->string('reserved_by', 255)->nullable();
        });

        // 5. Create marketplace_leads table (integrated with CRM later)
        Schema::create('marketplace_leads', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->uuid('project_id')->nullable();
            $table->uuid('layout_id')->nullable();
            $table->uuid('plot_id')->nullable();
            $table->string('lead_type', 50); // Callback, Site Visit, Brochure, Enquiry, WhatsApp, Call, Email
            $table->string('name', 255);
            $table->string('email', 255);
            $table->string('phone', 50);
            $table->text('message')->nullable();
            $table->string('status', 50)->default('NEW'); // NEW, CRM_SYNCED, CONTACTED, CONVERTED_CUSTOMER, BOOKING_CREATED, CLOSED
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
            $table->foreign('layout_id')->references('id')->on('layouts')->onDelete('set null');
            $table->foreign('plot_id')->references('id')->on('plots')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_leads');

        Schema::table('plots', function (Blueprint $table) {
            $table->dropColumn(['price', 'marketplace_visible', 'booking_status', 'reserved_by']);
        });

        Schema::table('layouts', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'price_range', 'downloads_count']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['publishing_status', 'is_featured', 'seo_settings', 'moderation_status', 'moderation_history', 'views_count']);
        });

        Schema::dropIfExists('developer_profiles');
    }
};
