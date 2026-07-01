<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $table = 'email_templates';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'template_key',
        'name',
        'subject',
        'body_html',
        'body_text',
    ];

    protected $casts = [
        'id' => 'string',
    ];
}
