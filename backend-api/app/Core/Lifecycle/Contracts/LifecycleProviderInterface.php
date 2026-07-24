<?php

namespace App\Core\Lifecycle\Contracts;

interface LifecycleProviderInterface
{
    public function entityType(): string;
    public function module(): string;
    public function definition(): LifecycleDefinitionInterface;
    public function version(): string;
    public function supports(object|string $entity): bool;
    public function resolveCurrentState(object|array $entity): string;
    public function applyState(object|array &$entity, string $state): void;
}
