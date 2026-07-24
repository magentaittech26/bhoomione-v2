<?php

namespace App\Core\Lifecycle\Contracts;

interface LifecycleRegistryInterface
{
    public function register(LifecycleProviderInterface $provider): void;
    public function getByEntityType(string $entityType): LifecycleProviderInterface;
    public function getByLifecycleCode(string $code): LifecycleProviderInterface;
    public function hasEntityType(string $entityType): bool;
    public function hasLifecycleCode(string $code): bool;
    public function all(): array;
    public function validateRegistry(): array;
}
