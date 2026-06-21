<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name', 255);
            $table->string('email', 255)->unique();
            $table->string('phone', 50)->unique();
            $table->string('password_hash', 255);
            $table->string('status', 50)->default('ACTIVE'); // ACTIVE, SUSPENDED, BLACKLISTED
            $table->timestamps();

            $table->index('email');
            $table->index('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
