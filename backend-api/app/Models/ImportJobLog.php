<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportJobLog extends Model
{
    protected $table = 'import_job_logs';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'import_job_id',
        'log_level',
        'step_name',
        'message',
        'duration_ms',
    ];

    public function importJob(): BelongsTo
    {
        return $this->belongsTo(ImportJob::class, 'import_job_id');
    }
}
