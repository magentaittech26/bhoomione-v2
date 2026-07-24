<?php

namespace App\Core\Lifecycle\Contracts;

interface LifecycleEngineInterface
{
    public function definition(string $entityType): LifecycleDefinitionInterface;
    public function currentState(object|array $entity, string $entityType): string;
    public function availableTransitions(object|array $entity, LifecycleContextInterface $context): array;
    public function canTransition(object|array $entity, string $transitionCode, LifecycleContextInterface $context): LifecycleTransitionResultInterface;
    public function explainTransition(object|array $entity, string $transitionCode, LifecycleContextInterface $context): LifecycleTransitionResultInterface;
    public function transition(object|array &$entity, string $transitionCode, LifecycleContextInterface $context): LifecycleTransitionResultInterface;
    public function reverse(object|array &$entity, string $transitionId, LifecycleContextInterface $context): LifecycleTransitionResultInterface;
    public function history(string $entityType, string $entityId, ?string $tenantId = null, int $limit = 50): array;
}
