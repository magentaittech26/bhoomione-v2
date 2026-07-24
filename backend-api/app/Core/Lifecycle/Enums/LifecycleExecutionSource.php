<?php

namespace App\Core\Lifecycle\Enums;

enum LifecycleExecutionSource: string
{
    case WEB = 'WEB';
    case API = 'API';
    case MOBILE = 'MOBILE';
    case OFFLINE_SYNC = 'OFFLINE_SYNC';
    case IMPORT = 'IMPORT';
    case COMMAND = 'COMMAND';
    case JOB = 'JOB';
    case WORKFLOW = 'WORKFLOW';
    case SYSTEM = 'SYSTEM';
}
