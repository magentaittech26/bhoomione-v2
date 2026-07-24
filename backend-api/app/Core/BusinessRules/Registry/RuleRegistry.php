<?php

namespace App\Core\BusinessRules\Registry;

use App\Core\BusinessRules\Contracts\BusinessRuleContextInterface;
use App\Core\BusinessRules\Contracts\BusinessRuleInterface;
use App\Core\BusinessRules\Contracts\RuleRegistryInterface;
use InvalidArgumentException;

class RuleRegistry implements RuleRegistryInterface
{
    /** @var array<string, BusinessRuleInterface> */
    protected array $rules = [];

    public function register(BusinessRuleInterface $rule): void
    {
        $code = $rule->code();

        if (empty($code)) {
            throw new InvalidArgumentException("Rule code cannot be empty.");
        }

        if (isset($this->rules[$code])) {
            throw new InvalidArgumentException("Duplicate business rule code detected: {$code}");
        }

        $this->rules[$code] = $rule;
    }

    public function get(string $code): ?BusinessRuleInterface
    {
        return $this->rules[$code] ?? null;
    }

    public function has(string $code): bool
    {
        return isset($this->rules[$code]);
    }

    public function getByModule(string $module): array
    {
        return array_values(array_filter(
            $this->rules,
            fn(BusinessRuleInterface $rule) => strtolower($rule->module()) === strtolower($module)
        ));
    }

    public function getByAction(string $action, BusinessRuleContextInterface $context): array
    {
        $matching = array_filter(
            $this->rules,
            fn(BusinessRuleInterface $rule) => $rule->appliesTo($context)
        );

        // Sort rules deterministically by dependency resolution and code alphabetical
        return $this->sortRulesDeterministically(array_values($matching));
    }

    public function getByTag(string $tag): array
    {
        return array_values(array_filter(
            $this->rules,
            fn(BusinessRuleInterface $rule) => in_array($tag, $rule->tags(), true)
        ));
    }

    public function all(): array
    {
        return $this->rules;
    }

    public function validateRegistry(): array
    {
        $issues = [];
        foreach ($this->rules as $code => $rule) {
            foreach ($rule->dependencies() as $dependencyCode) {
                if (!isset($this->rules[$dependencyCode])) {
                    $issues[] = "Rule [{$code}] depends on unregistered rule [{$dependencyCode}].";
                }
            }
        }
        return $issues;
    }

    /**
     * @param array<BusinessRuleInterface> $rules
     * @return array<BusinessRuleInterface>
     */
    protected function sortRulesDeterministically(array $rules): array
    {
        usort($rules, function (BusinessRuleInterface $a, BusinessRuleInterface $b) {
            // Check dependency order
            if (in_array($a->code(), $b->dependencies(), true)) {
                return -1; // $a must come before $b
            }
            if (in_array($b->code(), $a->dependencies(), true)) {
                return 1; // $b must come before $a
            }
            // Fallback to alphabetical sorting by code
            return strcmp($a->code(), $b->code());
        });

        return $rules;
    }
}
