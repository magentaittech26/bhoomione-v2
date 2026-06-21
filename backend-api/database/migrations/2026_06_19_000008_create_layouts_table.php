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
        if (!Schema::hasTable('layouts')) {
            Schema::create('layouts', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('project_id');
                $table->string('name', 255);
                $table->string('code', 100);
                $table->string('layout_type', 50)->default('RESIDENTIAL');
                $table->string('approval_number', 150)->nullable();
                $table->date('approval_date')->nullable();
                $table->decimal('total_area_value', 16, 4)->nullable();
                $table->uuid('total_area_unit_id')->nullable();
                $table->uuid('measurement_unit_id');
                $table->string('status', 50)->default('DRAFT');
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                $table->foreign('total_area_unit_id')->references('id')->on('measurement_units')->onDelete('restrict');
                $table->foreign('measurement_unit_id')->references('id')->on('measurement_units')->onDelete('restrict');
                $table->unique(['project_id', 'code']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('layouts');
    }
};
