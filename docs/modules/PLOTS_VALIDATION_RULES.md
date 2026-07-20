# Plot Validation Suite Rules (21-Point Checks)

The validation engine runs a comprehensive suite of checks on layout subdivision geometries.

## The 21 Mandatory Geometrical Checks

1. **Check 1: Boundary Containment** (ERROR) - Verifies the plot is fully enclosed inside the Site Boundary.
2. **Check 2: Self-Intersection** (ERROR) - Prevents self-crossing or self-intersecting polygon borders.
3. **Check 3: Duplicate Plot Number** (ERROR) - Asserts unique number identifiers across the active layout.
4. **Check 4: Plot Overlap** (ERROR) - Flags overlaps between adjacent plots.
5. **Check 5: Road Overlap** (ERROR) - Detects encroachment into road alignment buffers.
6. **Check 6: Park Overlap** (ERROR) - Prevents overlaps with designated green spaces.
7. **Check 7: Amenity Overlap** (ERROR) - Prevents overlaps with civic amenity zones.
8. **Check 8: Utility Overlap** (WARNING) - Identifies intersections with critical pipeline easement buffers.
9. **Check 9: Minimum Area** (WARNING) - Enforces minimum size from active planning profile.
10. **Check 10: Maximum Area Advisory** (RECOMMENDATION) - Recommends subdividing massive plots.
11. **Check 11: Minimum Frontage** (WARNING) - Asserts minimum frontage limit.
12. **Check 12: Minimum Depth** (WARNING) - Asserts minimum depth limit.
13. **Check 13: Aspect Ratio** (WARNING) - Flags highly narrow/elongated plots.
14. **Check 14: Road Access** (ERROR) - Requires connectivity with at least one roadway alignment.
15. **Check 15: Narrow Access** (WARNING) - Flags frontage segments below 4.0 meters.
16. **Check 16: Tiny Residual Sliver** (ERROR) - Blocks tiny drawing artifacts.
17. **Check 17: Corner Lot Classification** (RECOMMENDATION) - Suggests corner classification if plot touches multiple roads.
18. **Check 18: Uncalibrated Workspace** (WARNING) - Identifies provisional measurements when layout isn't calibrated.
19. **Check 19: Duplicate Vertices** (ERROR) - Blocks zero-area or duplicate point layout errors.
20. **Check 20: Isolation/Gap** (RECOMMENDATION) - Flags isolated plots with excessive gaps.
21. **Check 21: Active Planning Profile Compliance** (WARNING) - Evaluates layout parameters against the selected state profile.
