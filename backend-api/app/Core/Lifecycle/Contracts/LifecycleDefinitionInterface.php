<?php

namespace App\Core\Lifecycle\Contracts;

interface LifecycleDefinitionInterface
{
    public function code(): string;
    public function name(): string;
    public function version(): string;
    public function states(): array;
    public function transitions(): array;
    public function initialState(): string;
    public function terminalStates(): array;
    public function state(string $code): ?LifecycleStateInterface;
    public function transition(string $code): ?LifecycleTransitionInterface;
    public function availableTransitions(string $currentState): array;
    public function validateDefinition(): array;
    public function toArray(): array;
}
