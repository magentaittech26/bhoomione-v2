<?php

namespace App\Core\BusinessRules\Results;

use App\Core\BusinessRules\Contracts\RuleResultInterface;
use App\Core\BusinessRules\Enums\RuleSeverity;

class RuleResult implements RuleResultInterface
{
    protected string $ruleCode;
    protected string $ruleVersion;
    protected bool $passed;
    protected RuleSeverity $severity;
    protected string $message;
    protected ?string $userMessage;
    protected ?string $developerMessage;
    protected ?string $errorCode;
    protected array $evidence;
    protected array $failedConditions;
    protected ?string $remediation;
    protected array $metadata;
    protected string $evaluatedAt;
    protected float $executionTimeMs;

    public function __construct(
        string $ruleCode,
        string $ruleVersion,
        bool $passed,
        RuleSeverity $severity,
        string $message,
        ?string $userMessage = null,
        ?string $developerMessage = null,
        ?string $errorCode = null,
        array $evidence = [],
        array $failedConditions = [],
        ?string $remediation = null,
        array $metadata = [],
        ?float $executionTimeMs = 0.0
    ) {
        $this->ruleCode = $ruleCode;
        $this->ruleVersion = $ruleVersion;
        $this->passed = $passed;
        $this->severity = $severity;
        $this->message = $message;
        $this->userMessage = $userMessage ?? $message;
        $this->developerMessage = $developerMessage;
        $this->errorCode = $errorCode;
        $this->evidence = $evidence;
        $this->failedConditions = $failedConditions;
        $this->remediation = $remediation;
        $this->metadata = $metadata;
        $this->evaluatedAt = now()->toIso8601String();
        $this->executionTimeMs = $executionTimeMs ?? 0.0;
    }

    public static function pass(
        string $ruleCode,
        string $ruleVersion = '1.0.0',
        string $message = 'Rule evaluation passed successfully.',
        array $evidence = [],
        float $executionTimeMs = 0.0
    ): self {
        return new self(
            ruleCode: $ruleCode,
            ruleVersion: $ruleVersion,
            passed: true,
            severity: RuleSeverity::INFORMATIONAL,
            message: $message,
            evidence: $evidence,
            executionTimeMs: $executionTimeMs
        );
    }

    public static function fail(
        string $ruleCode,
        string $ruleVersion,
        string $message,
        string $errorCode,
        ?string $userMessage = null,
        ?string $developerMessage = null,
        array $evidence = [],
        array $failedConditions = [],
        ?string $remediation = null,
        RuleSeverity $severity = RuleSeverity::BLOCKING,
        float $executionTimeMs = 0.0
    ): self {
        return new self(
            ruleCode: $ruleCode,
            ruleVersion: $ruleVersion,
            passed: false,
            severity: $severity,
            message: $message,
            userMessage: $userMessage,
            developerMessage: $developerMessage,
            errorCode: $errorCode,
            evidence: $evidence,
            failedConditions: $failedConditions,
            remediation: $remediation,
            executionTimeMs: $executionTimeMs
        );
    }

    public static function warning(
        string $ruleCode,
        string $ruleVersion,
        string $message,
        string $errorCode,
        ?string $userMessage = null,
        array $evidence = [],
        ?string $remediation = null,
        float $executionTimeMs = 0.0
    ): self {
        return new self(
            ruleCode: $ruleCode,
            ruleVersion: $ruleVersion,
            passed: false,
            severity: RuleSeverity::WARNING,
            message: $message,
            userMessage: $userMessage,
            errorCode: $errorCode,
            evidence: $evidence,
            remediation: $remediation,
            executionTimeMs: $executionTimeMs
        );
    }

    public static function information(
        string $ruleCode,
        string $ruleVersion,
        string $message,
        array $evidence = [],
        float $executionTimeMs = 0.0
    ): self {
        return new self(
            ruleCode: $ruleCode,
            ruleVersion: $ruleVersion,
            passed: true,
            severity: RuleSeverity::INFORMATIONAL,
            message: $message,
            evidence: $evidence,
            executionTimeMs: $executionTimeMs
        );
    }

    public function getRuleCode(): string { return $this->ruleCode; }
    public function getRuleVersion(): string { return $this->ruleVersion; }
    public function isPassed(): bool { return $this->passed; }
    public function getSeverity(): RuleSeverity { return $this->severity; }
    public function getMessage(): string { return $this->message; }
    public function getUserMessage(): ?string { return $this->userMessage; }
    public function getDeveloperMessage(): ?string { return $this->developerMessage; }
    public function getErrorCode(): ?string { return $this->errorCode; }
    public function isBlocking(): bool { return !$this->passed && $this->severity === RuleSeverity::BLOCKING; }
    public function getEvidence(): array { return $this->evidence; }
    public function getFailedConditions(): array { return $this->failedConditions; }
    public function getRemediation(): ?string { return $this->remediation; }
    public function getMetadata(): array { return $this->metadata; }
    public function getEvaluatedAt(): string { return $this->evaluatedAt; }
    public function getExecutionTimeMs(): float { return $this->executionTimeMs; }

    public function toArray(): array
    {
        return [
            'rule_code' => $this->ruleCode,
            'rule_version' => $this->ruleVersion,
            'passed' => $this->passed,
            'severity' => $this->severity->value,
            'message' => $this->message,
            'user_message' => $this->userMessage,
            'developer_message' => $this->developerMessage,
            'error_code' => $this->errorCode,
            'blocking' => $this->isBlocking(),
            'evidence' => $this->evidence,
            'failed_conditions' => $this->failedConditions,
            'remediation' => $this->remediation,
            'metadata' => $this->metadata,
            'evaluated_at' => $this->evaluatedAt,
            'execution_time_ms' => $this->executionTimeMs,
        ];
    }
}
