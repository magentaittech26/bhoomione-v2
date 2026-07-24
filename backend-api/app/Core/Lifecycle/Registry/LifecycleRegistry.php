<?php

namespace App\Core\Lifecycle\Registry;

use App\Core\Lifecycle\Contracts\LifecycleProviderInterface;
use App\Core\Lifecycle\Contracts\LifecycleRegistryInterface;

class LifecycleRegistry implements LifecycleRegistryInterface
{
    /** @var array<string, LifecycleProviderInterface> */
    protected array $byEntityType = [];
    /** @var array<string, LifecycleProviderInterface> */
    protected array $byLifecycleCode = [];

    public function register(LifecycleProviderInterface $provider): void
    {
        $entityType = strtolower($provider->entityType());
        $code = strtolower($provider->definition()->code());

        if (isset($this->byEntityType[$entityType])) {
            throw new \InvalidArgumentException("Duplicate lifecycle provider registration for entity type [{$entityType}].");
        }

        if (isset($this->byLifecycleCode[$code])) {
            throw new \InvalidArgumentException("Duplicate lifecycle provider registration for code [{$code}].");
        }

        $this->byEntityType[$entityType] = $provider;
        $this->byLifecycleCode[$code] = $provider;
    }

    public function getByEntityType(string $entityType): LifecycleProviderInterface
    {
        $type = strtolower($entityType);
        if (!isset($this->byEntityType[$type])) {
            throw new \InvalidArgumentException("No lifecycle provider registered for entity type [{$entityType}].");
        }
        return $this->byEntityType[$type];
    }

    public function getByLifecycleCode(string $code): LifecycleProviderInterface
    {
        $cd = strtolower($code);
        if (!isset($this->byLifecycleCode[$cd])) {
            throw new \InvalidArgumentException("No lifecycle provider registered for code [{$code}].");
        }
        return $this->byLifecycleCode[$cd];
    }

    public function hasEntityType(string $entityType): bool
    {
        return isset($this->byEntityType[strtolower($entityType)]);
    }

    public function hasLifecycleCode(string $code): bool
    {
        return isset($this->byLifecycleCode[strtolower($code)]);
    }

    public function all(): array
    {
        return array_values($this->byLifecycleCode);
    }

    public function validateRegistry(): array
    {
        $issues = [];
        foreach ($this->byLifecycleCode as $code => $provider) {
            $def = $provider->definition();
            $defIssues = $def->validateDefinition();
            foreach ($defIssues as $issue) {
                $issues[] = "[{$code}] {$issue}";
            }
        }
        return $issues;
    }
}
