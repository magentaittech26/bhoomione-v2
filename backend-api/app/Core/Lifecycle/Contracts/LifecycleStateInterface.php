<?php

namespace App\Core\Lifecycle\Contracts;

use App\Core\Lifecycle\Enums\StateColorToken;

interface LifecycleStateInterface
{
    public function code(): string;
    public function name(): string;
    public function description(): string;
    public function sequence(): int;
    public function isInitial(): bool;
    public function isTerminal(): bool;
    public function isActive(): bool;
    public function isVisible(): bool;
    public function isOperational(): bool;
    public function isImmutable(): bool;
    public function colorToken(): StateColorToken;
    public function allowedActions(): array;
    public function metadata(): array;
    public function toArray(): array;
}
