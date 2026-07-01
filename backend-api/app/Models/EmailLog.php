<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    protected $table = 'email_logs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'provider_code',
        'template_key',
        'recipient_email',
        'recipient_name',
        'subject',
        'body_html',
        'status',
        'error_message',
        'retry_count',
        'max_retries',
        'sent_at',
    ];

    protected $casts = [
        'id' => 'string',
        'retry_count' => 'integer',
        'max_retries' => 'integer',
        'sent_at' => 'datetime',
    ];
}
