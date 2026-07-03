<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationConfiguration extends Model
{
    protected $table = 'notification_configurations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'channel',
        'provider_code',
        'name',
        'is_enabled',
        'is_default',
        'config_params',
        'status',
    ];

    protected $casts = [
        'id' => 'string',
        'is_enabled' => 'boolean',
        'is_default' => 'boolean',
    ];

    private static $sensitiveKeys = [
        'api_key', 'apiKey',
        'api_secret', 'apiSecret',
        'client_secret', 'clientSecret',
        'access_token', 'accessToken',
        'bearer_token', 'bearerToken',
        'private_key', 'privateKey',
        'webhook_secret', 'webhookSecret',
        'smtp_password', 'smtpPassword',
        'auth_key', 'authKey',
        'auth_token', 'authToken',
        'password',
        'secret',
        'token',
        'account_sid', 'accountSid',
        'auth_id', 'authId',
        'access_key_id', 'accessKeyId',
        'secret_access_key', 'secretAccessKey',
    ];

    public function getConfigParamsAttribute($value)
    {
        if (empty($value)) {
            return [];
        }

        $params = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($params)) {
            return [];
        }

        foreach ($params as $key => $val) {
            if (in_array($key, self::$sensitiveKeys) && is_string($val) && !empty($val)) {
                try {
                    $params[$key] = \Illuminate\Support\Facades\Crypt::decryptString($val);
                } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                    // Not encrypted or decryption failed, keep as is
                }
            }
        }

        return $params;
    }

    public function setConfigParamsAttribute($value)
    {
        if (empty($value)) {
            $this->attributes['config_params'] = json_encode([]);
            return;
        }

        $params = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($params)) {
            $this->attributes['config_params'] = json_encode([]);
            return;
        }

        foreach ($params as $key => $val) {
            if (in_array($key, self::$sensitiveKeys) && is_string($val) && !empty($val) && $val !== '********') {
                $params[$key] = \Illuminate\Support\Facades\Crypt::encryptString($val);
            }
        }

        $this->attributes['config_params'] = json_encode($params);
    }
}
