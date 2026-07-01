<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    protected $table = 'notification_logs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'event_type',
        'channel',
        'recipient',
        'subject',
        'body',
        'status',
        'retry_count',
        'max_retries',
        'scheduled_at',
        'sent_at',
        'error_message',
        'audit_trail',
        'whatsapp_media_url',
        'whatsapp_media_type',
    ];

    protected $casts = [
        'id' => 'string',
        'retry_count' => 'integer',
        'max_retries' => 'integer',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'audit_trail' => 'array',
    ];
}
