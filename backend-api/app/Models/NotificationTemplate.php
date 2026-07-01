<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    protected $table = 'notification_templates';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'event_type',
        'name',
        'email_subject',
        'email_body_html',
        'sms_template',
        'whatsapp_template',
        'push_title',
        'push_body',
        'in_app_body',
        'webhook_payload_template',
        'whatsapp_media_url',
        'whatsapp_media_type',
    ];

    protected $casts = [
        'id' => 'string',
    ];
}
