# BhoomiOne Zero-Touch Provisioning Sequence Diagram

This text-based/Mermaid sequence diagram outlines the pipeline workflow, and the rollback lifecycle when errors are encountered.

---

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Operator / Client SignUp
    participant UI as React SPA (TenantManagementTab)
    participant API as Laravel Routing (TenantProvisioningController)
    participant Service as TenantProvisioningService
    participant Queue as Pipeline Executor
    participant DB as PostgreSQL (BhoomiOne DB)

    Admin->>UI: Selects Template + Inputs Credentials + Submits Form
    UI->>API: POST /api/v1/admin/tenants/provision (Payload)
    API->>Service: initiateProvisioning(payload)
    Service->>DB: Write Job Record (Status: PENDING)
    Service-->>API: Job UUID Returned
    API-->>UI: Response 202 (Enqueued Success)
    UI-->>Admin: Show Live Progress Status Bar (0%)

    Note over Service, Queue: Async / Sync Pipeline Worker Begins Run
    
    Service->>Queue: executePipeline(JobId)
    Queue->>Service: Step 1: Validate Tenant Domain Codes
    Service->>DB: Check availability
    DB-->>Service: OK
    Service->>UI: Live Stream Step Update: VALIDATING (10%)
    
    Queue->>Service: Step 2: Create Tenant Cluster Record
    Service->>DB: INSERT INTO tenants (...)
    DB-->>Service: OK
    Service->>UI: Live Stream Step Update: CREATING_WORKSPACE (20%)

    Queue->>Service: Step 5: Allocate Subscription & Limits
    Service->>DB: INSERT INTO subscription_limits (...)
    DB-->>Service: OK
    Service->>UI: Live Stream Step Update: APPLYING_LIMITS (55%)

    alt Step Failure (e.g. Failure applying customized template modules)
        Queue->>Service: Step 10: Install Default Modules
        Service->>DB: Database constraint or memory fail!
        DB-->>Service: SQL Error Code / Exception
        Note over Service, Queue: Halted! Initiating Rollback Engine
        Service->>DB: Update Job (Status: ROLLING_BACK, error_message)
        
        Service->>DB: Delete Subscription limits created in Step 5
        Service->>DB: Delete Tenant Cluster record created in Step 2
        
        Service->>DB: Update Job (Status: FAILED, current_step: "Rolled Back")
        Service-->>UI: Refreshes to status RED (Halted / Rolled Back)
        Admin->>UI: Clicks "Retry" or "Resume"
        UI->>API: POST /api/v1/admin/tenants/jobs/{id}/retry
        API->>Service: retryProvisioningJob(id)
        Service->>Queue: executePipeline(JobId) (Restarts Cleanly)
    else Success path
        Queue->>Service: Step 12: Create Primary Admin & Seeding Demo
        Service->>DB: INSERT admin, INSERT sample plots, templates
        DB-->>Service: OK
        Service->>DB: Update Job (Status: SUCCESS, Progress: 100%)
        Service-->>UI: Refreshes to status GREEN (SUCCESS)
    end
```
---

## Key Takeaways
1. **Unblocked Admin UX**: The enqueued process yields immediate interactive control back to the operator.
2. **Reverse Cleanup sequence**: Ensures strict referential integrity compliance on rollbacks.
3. **Flexible controls**: The same state pattern drives `Retry`, `Cancel`, and `Resume` triggers seamlessly.
