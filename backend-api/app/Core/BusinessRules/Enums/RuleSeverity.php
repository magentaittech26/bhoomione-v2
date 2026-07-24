<?php

namespace App\Core\BusinessRules\Enums;

enum RuleSeverity: string
{
    case BLOCKING = 'BLOCKING';
    case WARNING = 'WARNING';
    case INFORMATIONAL = 'INFORMATIONAL';
}
