<?php

namespace App\Core\BusinessRules\Enums;

enum EvaluationMode: string
{
    case ENFORCE = 'ENFORCE';
    case EXPLAIN = 'EXPLAIN';
    case DRY_RUN = 'DRY_RUN';
}
