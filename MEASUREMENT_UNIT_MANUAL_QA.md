# Measurement Unit Manual QA Test Suite

## Test Scenarios

1. **Core Module Non-Disability Test**:
   - Log in as Tenant Admin.
   - Attempt to disable `core.mdm.measurement_units` module in settings.
   - **Expected Result**: Core module cannot be disabled or unsubscribed by tenant admin.

2. **Tenant Configuration Test**:
   - Navigate to Master Data -> Measurement Units.
   - Update display precision for `Square Feet` to 4 decimal places and set custom symbol `sqft-custom`.
   - **Expected Result**: Tenant settings updated; global conversion factor remains unchanged.

3. **Tenant Default Unit Change Test**:
   - Set `Square Meters` as default Area unit for tenant.
   - **Expected Result**: `SQM` becomes default Area unit for tenant; previous default `SQFT` default flag cleared.

4. **Project Default Override Test**:
   - Assign `Acres` as default unit on Project form.
   - **Expected Result**: Project plots display area in `Acres` while other projects respect tenant default.
