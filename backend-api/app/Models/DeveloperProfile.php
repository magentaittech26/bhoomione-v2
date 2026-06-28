<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeveloperProfile extends Model
{
    protected $table = 'developer_profiles';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'company_name',
        'logo',
        'cover_image',
        'description',
        'rera_number',
        'gst',
        'office_address',
        'website',
        'phone',
        'email',
        'social_links',
        'completed_projects',
        'active_projects',
        'years_in_business',
        'verification_status',
        'rating',
        'public_visibility',
        'seo_slug',
    ];

    protected $casts = [
        'social_links' => 'array',
        'completed_projects' => 'integer',
        'active_projects' => 'integer',
        'years_in_business' => 'integer',
        'rating' => 'decimal:2',
        'public_visibility' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
