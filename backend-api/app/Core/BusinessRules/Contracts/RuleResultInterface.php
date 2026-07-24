<?php

namespace App\Core\BusinessRules\Contracts;

use App\Core\BusinessRules\Enums\RuleSeverity;

interface RuleResultInterface
{
    public function getRuleCode(): string;
    public function getRuleVersion(): string;
    public function isPassed(): bool;
    public function getSeverity(): RuleSeverity;
    public function getMessage(): string;
    public function getUserMessage(): ?string;
    public function getDeveloperMessage(): ?string;
    public function getErrorCode(): ?string;
    public function isBlocking(): bool;
    public function getEvidence(): array;
    public function getFailedConditions(): array;
    public function getRemediation(): ?string;
    public function getMetadata(): array;
    public function getEvaluatedAt(): string;
    public function getExecutionTimeMs(): float;
    public function toArray(): array;
}
