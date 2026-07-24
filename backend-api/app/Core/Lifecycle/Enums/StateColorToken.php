<?php

namespace App\Core\Lifecycle\Enums;

enum StateColorToken: string
{
    case NEUTRAL = 'neutral';
    case INFORMATIONAL = 'informational';
    case WARNING = 'warning';
    case POSITIVE = 'positive';
    case NEGATIVE = 'negative';
    case INACTIVE = 'inactive';
}
