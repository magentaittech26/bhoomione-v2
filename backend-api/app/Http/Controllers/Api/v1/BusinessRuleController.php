<?php

namespace App\Http\Controllers\Api\v1;

use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Contracts\BusinessRuleEngineInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessRuleController extends Controller
{
    protected BusinessRuleEngineInterface $engine;

    public function __construct(BusinessRuleEngineInterface $engine)
    {
        $this->engine = $engine;
    }

    public function evaluate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|max:100',
            'entity_type' => 'required|string|max:100',
            'entity_id' => 'nullable|string|max:100',
            'project_id' => 'nullable|string|max:100',
            'request_data' => 'nullable|array',
            'entity_snapshot' => 'nullable|array',
            'related_entity_snapshots' => 'nullable|array',
        ]);

        $tenantId = $request->header('X-Tenant-ID') ?? $request->attributes->get('tenant_id');
        $actorId = auth()->id();

        $context = BusinessRuleContext::create([
            'tenant_id' => $tenantId,
            'actor_id' => $actorId,
            'action' => $validated['action'],
            'entity_type' => $validated['entity_type'],
            'entity_id' => $validated['entity_id'] ?? null,
            'project_id' => $validated['project_id'] ?? null,
            'request_data' => $validated['request_data'] ?? [],
            'entity_snapshot' => $validated['entity_snapshot'] ?? null,
            'related_entity_snapshots' => $validated['related_entity_snapshots'] ?? [],
            'execution_source' => 'API',
        ]);

        $evaluation = $this->engine->explain($validated['action'], $context);

        $response = $evaluation->toApiResponse();
        $status = $evaluation->hasBlockingFailures() ? 422 : 200;

        return response()->json($response, $status);
    }
}
