<?php

namespace App\Core\Lifecycle\Support;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Contracts\LifecycleProviderInterface;

abstract class LifecycleProvider implements LifecycleProviderInterface
{
    protected string $entityType;
    protected string $module;
    protected string $version = '1.0.0';
    protected ?LifecycleDefinitionInterface $definition = null;

    public function entityType(): string { return $this->entityType; }
    public function module(): string { return $this->module; }
    public function version(): string { return $this->version; }

    public function supports(object|string $entity): bool
    {
        if (is_string($entity)) {
            return strtolower($entity) === strtolower($this->entityType);
        }
        return strtolower(class_basename($entity)) === strtolower($this->entityType);
    }

    public function resolveCurrentState(object|array $entity): string
    {
        if (is_array($entity)) {
            return strtoupper($entity['status'] ?? $entity['state'] ?? $this->definition()->initialState());
        }
        if (isset($entity->status)) {
            return strtoupper((string)$entity->status);
        }
        if (isset($entity->state)) {
            return strtoupper((string)$entity->state);
        }
        return $this->definition()->initialState();
    }

    public function applyState(object|array &$entity, string $state): void
    {
        $stateUpper = strtoupper($state);
        if (is_array($entity)) {
            if (array_key_exists('status', $entity)) {
                $entity['status'] = $stateUpper;
            } else {
                $entity['state'] = $stateUpper;
            }
        } elseif (is_object($entity)) {
            if (property_exists($entity, 'status') || isset($entity->status)) {
                $entity->status = $stateUpper;
            } else {
                $entity->state = $stateUpper;
            }
            if (method_exists($entity, 'save')) {
                $entity->save();
            }
        }
    }
}
