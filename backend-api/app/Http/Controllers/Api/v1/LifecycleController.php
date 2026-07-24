<?php

namespace App\Http\Controllers\Api\v1;

use App\Core\Lifecycle\Context\LifecycleContext;
use App\Core\Lifecycle\Contracts\LifecycleEngineInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LifecycleController extends Controller
{
    protected LifecycleEngineInterface $engine;

    public function __construct(LifecycleEngineInterface $engine)
    {
        $this->engine = $engine;
    }

    public function show(Request $request, string $entityType, string $entityId): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID') ?? $request->attributes->get('tenant_id');
        $actorId = auth()->id();

        $context = LifecycleContext::create([
            'tenant_id' => $tenantId,
            'actor_id' => $actorId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'execution_source' => 'API',
            'active_entitlements' => $request->attributes->get('active_entitlements', []),
        ]);

        $definition = $this->engine->definition($entityType);
        $dummyEntity = ['id' => $entityId, 'status' => $request->query('status', 'DRAFT')];
        $currentState = $this->engine->currentState($dummyEntity, $entityType);
        $availableTransitions = $this->engine->availableTransitions($dummyEntity, $context);
        $history = $this->engine->history($entityType, $entityId, $tenantId, 10);

        return response()->json([
            'success' => true,
            'data' => [
                'lifecycle_code' => $definition->code(),
                'lifecycle_version' => $definition->version(),
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'current_state' => $currentState,
                'available_transitions' => $availableTransitions,
                'recent_history' => $history,
            ],
            'correlation_id' => $context->getCorrelationId(),
        ]);
    }

    public function evaluate(Request $request, string $entityType, string $entityId): JsonResponse
    {
        $validated = $request->validate([
            'transition_code' => 'required|string|max:100',
            'current_status' => 'nullable|string|max:50',
            'reason' => 'nullable|string',
            'request_data' => 'nullable|array',
            'entity_snapshot' => 'nullable|array',
        ]);

        $tenantId = $request->header('X-Tenant-ID') ?? $request->attributes->get('tenant_id');
        $actorId = auth()->id();

        $entitySnapshot = $validated['entity_snapshot'] ?? [
            'id' => $entityId,
            'status' => $validated['current_status'] ?? 'DRAFT',
        ];

        $context = LifecycleContext::create([
            'tenant_id' => $tenantId,
            'actor_id' => $actorId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'transition_code' => $validated['transition_code'],
            'reason' => $validated['reason'] ?? null,
            'request_data' => $validated['request_data'] ?? [],
            'entity_snapshot' => $entitySnapshot,
            'execution_source' => 'API',
            'active_entitlements' => $request->attributes->get('active_entitlements', []),
        ]);

        $evaluation = $this->engine->explainTransition($entitySnapshot, $validated['transition_code'], $context);

        $status = $evaluation->isPermitted() ? 200 : 422;
        return response()->json($evaluation->toApiResponse(), $status);
    }

    public function transition(Request $request, string $entityType, string $entityId): JsonResponse
    {
        $validated = $request->validate([
            'transition_code' => 'required|string|max:100',
            'current_status' => 'nullable|string|max:50',
            'reason' => 'nullable|string',
            'idempotency_key' => 'nullable|string|max:255',
            'request_data' => 'nullable|array',
            'entity_snapshot' => 'nullable|array',
        ]);

        $tenantId = $request->header('X-Tenant-ID') ?? $request->attributes->get('tenant_id');
        $actorId = auth()->id();

        $entitySnapshot = $validated['entity_snapshot'] ?? [
            'id' => $entityId,
            'status' => $validated['current_status'] ?? 'DRAFT',
        ];

        $context = LifecycleContext::create([
            'tenant_id' => $tenantId,
            'actor_id' => $actorId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'transition_code' => $validated['transition_code'],
            'reason' => $validated['reason'] ?? null,
            'idempotency_key' => $validated['idempotency_key'] ?? $request->header('X-Idempotency-Key'),
            'request_data' => $validated['request_data'] ?? [],
            'entity_snapshot' => $entitySnapshot,
            'execution_source' => 'API',
            'active_entitlements' => $request->attributes->get('active_entitlements', []),
        ]);

        try {
            $result = $this->engine->transition($entitySnapshot, $validated['transition_code'], $context);
            return response()->json($result->toApiResponse(), 200);
        } catch (\App\Core\Lifecycle\Exceptions\LifecycleStateConflictException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => [
                    'code' => 'LIFECYCLE_STATE_CONFLICT',
                    'expected_states' => $e->getExpectedState(),
                    'current_state' => $e->getCurrentState(),
                ],
            ], 409);
        } catch (\App\Core\Lifecycle\Exceptions\LifecycleEntitlementException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => [
                    'code' => 'SUBSCRIPTION_ENTITLEMENT_REQUIRED',
                    'required_entitlement' => $e->getRequiredEntitlement(),
                ],
            ], 402);
        } catch (\App\Core\Lifecycle\Exceptions\LifecycleException $e) {
            $res = $e->getResult();
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 422;
            return response()->json($res ? $res->toApiResponse() : [
                'success' => false,
                'message' => $e->getMessage(),
                'error' => ['code' => 'LIFECYCLE_TRANSITION_BLOCKED'],
            ], $status);
        }
    }

    public function history(Request $request, string $entityType, string $entityId): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID') ?? $request->attributes->get('tenant_id');
        $limit = (int) $request->query('limit', 50);

        $history = $this->engine->history($entityType, $entityId, $tenantId, $limit);

        return response()->json([
            'success' => true,
            'data' => [
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'count' => count($history),
                'history' => $history,
            ],
        ]);
    }
}
