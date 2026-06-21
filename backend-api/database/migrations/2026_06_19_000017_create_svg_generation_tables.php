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
        // 1. svg_documents
        if (!Schema::hasTable('svg_documents')) {
            Schema::create('svg_documents', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->uuid('layout_id');
                $table->uuid('generation_batch_id');
                $table->decimal('width', 12, 4)->default(1000.0000);
                $table->decimal('height', 12, 4)->default(1000.0000);
                $table->string('viewbox', 100)->default('0 0 1000 1000');
                $table->integer('version')->default(1);
                $table->string('render_profile', 50)->default('DESKTOP'); // DESKTOP, TABLET, MOBILE
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->foreign('layout_id')->references('id')->on('layouts')->onDelete('cascade');
                $table->foreign('generation_batch_id')->references('id')->on('generation_batches')->onDelete('cascade');

                $table->index('tenant_id');
                $table->index('layout_id');
                $table->index('generation_batch_id');
                $table->unique(['layout_id', 'version', 'render_profile'], 'svg_docs_layout_version_profile_unique');
            });
        }

        // 2. svg_style_profiles
        if (!Schema::hasTable('svg_style_profiles')) {
            Schema::create('svg_style_profiles', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->string('profile_key', 100); // PLOT_AVAILABLE, PLOT_RESERVED, PLOT_BOOKED, PLOT_SOLD, ROAD_MAIN, ROAD_INTERNAL, PARK, AMENITY
                $table->string('fill_color', 50)->default('#FFFFFF');
                $table->string('stroke_color', 50)->default('#000000');
                $table->decimal('stroke_width', 8, 2)->default(1.00);
                $table->decimal('opacity', 4, 2)->default(1.00);
                $table->jsonb('additional_styles')->default(DB::raw("'{}'::jsonb"));
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->unique(['tenant_id', 'profile_key'], 'svg_style_profiles_tenant_key_unique');
            });
        }

        // 3. svg_elements
        if (!Schema::hasTable('svg_elements')) {
            Schema::create('svg_elements', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('svg_document_id');
                $table->uuid('source_geometry_entity_id')->nullable();
                $table->string('element_type', 50); // PATH, POLYGON, POLYLINE, TEXT, GROUP
                $table->text('svg_data');
                $table->jsonb('metadata')->default(DB::raw("'{}'::jsonb"));
                $table->timestamps();

                $table->foreign('svg_document_id')->references('id')->on('svg_documents')->onDelete('cascade');
                $table->foreign('source_geometry_entity_id')->references('id')->on('geometry_entities')->onDelete('set null');

                $table->index('svg_document_id');
                $table->index('source_geometry_entity_id');
            });
        }

        // 4. svg_labels
        if (!Schema::hasTable('svg_labels')) {
            Schema::create('svg_labels', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('svg_document_id');
                $table->uuid('source_plot_id')->nullable();
                $table->string('text', 255);
                $table->decimal('x', 12, 4);
                $table->decimal('y', 12, 4);
                $table->decimal('rotation', 8, 2)->default(0.00);
                $table->timestamps();

                $table->foreign('svg_document_id')->references('id')->on('svg_documents')->onDelete('cascade');
                $table->foreign('source_plot_id')->references('id')->on('plots')->onDelete('set null');

                $table->index('svg_document_id');
                $table->index('source_plot_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('svg_labels');
        Schema::dropIfExists('svg_elements');
        Schema::dropIfExists('svg_style_profiles');
        Schema::dropIfExists('svg_documents');
    }
};
