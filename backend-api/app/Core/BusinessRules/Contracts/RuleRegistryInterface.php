<?php

namespace App\Core\BusinessRules\Contracts;

interface RuleRegistryInterface
{
    public function register(BusinessRuleInterface $rule): void;
    public function get(string $code): ?BusinessRuleInterface;
    public function has(string $code): bool;
    public function getByModule(string $module): array;
    public function getByAction(string $action, BusinessRuleContextInterface $context): array;
    public function getByTag(string $tag): array;
    public function all(): array;
    public function validateRegistry(): array;
}
