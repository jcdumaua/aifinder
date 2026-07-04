# Phase 23D — Homepage Visual Upgrade Implementation Plan

## Phase Type

Docs-only homepage visual upgrade implementation plan.

## Purpose

Phase 23D translates the Phase 23C visual identity brand and homepage design gate into a precise, bounded implementation plan before code changes.

This phase does not implement the homepage visual upgrade.

This phase does not change source code, API routes, UI behavior, database state, schema, package files, or lockfiles.

This phase preserves the Discovery Engine completion boundary.

## Baseline

Latest pushed baseline before this phase:

```text
c23c8e0 Document visual identity homepage design gate
```

Expected repository status before this phase:

```text
## main...origin/main
```

## Accepted Prior Design Gate

Phase 23D accepts Phase 23C as the visual identity brand and homepage design gate.

Accepted markers:

```text
VISUAL_IDENTITY_BRAND_HOMEPAGE_DESIGN_GATE_COMPLETE
BRAND_DIRECTION_FINALIZED_FOR_IMPLEMENTATION_PLANNING
HOMEPAGE_SECTION_DESIGN_FINALIZED_FOR_IMPLEMENTATION_PLANNING
IMPLEMENTATION_ACCEPTANCE_CRITERIA_DEFINED
NO_SOURCE_IMPLEMENTATION_AUTHORIZED
NO_UI_BEHAVIOR_CHANGE_AUTHORIZED
NO_DISCOVERY_ENGINE_OPERATIONAL_REACTIVATION_AUTHORIZED
brand_feel=clean_simple_fast_premium
theme_direction=light_first
homepage_visual_priority=search_first
Phase 23D — Homepage Visual Upgrade Implementation Plan
```

## Implementation Plan Decision

Phase 23D records this implementation planning decision:

```text
HOMEPAGE_VISUAL_UPGRADE_IMPLEMENTATION_PLAN_COMPLETE
PHASE_23C_DESIGN_GATE_ACCEPTED
IMPLEMENTATION_SCOPE_BOUNDED_TO_PUBLIC_HOMEPAGE_VISUAL_LAYER
NO_IMPLEMENTATION_EXECUTED_IN_THIS_PHASE
NO_SOURCE_CHANGE_EXECUTED_IN_THIS_PHASE
NO_API_CHANGE_AUTHORIZED
NO_DB_CHANGE_AUTHORIZED
NO_PACKAGE_CHANGE_AUTHORIZED
NO_DISCOVERY_ENGINE_OPERATIONAL_REACTIVATION_AUTHORIZED
```

## Future Implementation Scope

A future implementation phase may be allowed to change visual presentation only after explicit approval.

Planned future implementation scope:

```text
future_scope_homepage_visual_layout=true
future_scope_homepage_hero_visuals=true
future_scope_homepage_search_visuals=true
future_scope_homepage_chips_visuals=true
future_scope_homepage_tool_card_visual_polish=true
future_scope_homepage_top_picks_visuals=true
future_scope_homepage_recently_added_visuals=true
future_scope_homepage_responsive_visuals=true
future_scope_accessibility_preservation=true
```

Excluded future implementation scope unless separately approved:

```text
future_scope_api_routes=false
future_scope_database_reads=false
future_scope_database_mutations=false
future_scope_discovery_engine_reactivation=false
future_scope_assistant_backend=false
future_scope_search_algorithm_change=false
future_scope_category_taxonomy_change=false
future_scope_package_install=false
future_scope_schema_migration=false
future_scope_type_generation=false
```

## Candidate Files For Future Implementation

Candidate files to inspect in the future implementation phase:

```text
candidate_file_app_page=app/page.tsx
candidate_file_public_tool_card=components/public/tool-card.tsx
candidate_file_global_styles=app/globals.css
candidate_file_tool_categories=lib/tool-categories.ts
candidate_file_homepage_control_api_read_only_reference=app/api/homepage-control/published/route.ts
```

Rules for candidate files:

```text
candidate_file_app_page_may_receive_visual_layout_changes_after_approval=true
candidate_file_public_tool_card_may_receive_visual_polish_after_approval=true
candidate_file_global_styles_may_receive_token_or_utility_adjustments_after_approval=true
candidate_file_tool_categories_read_only_reference_only=true
candidate_file_homepage_control_api_read_only_reference_only=true
```

Phase 23D does not authorize editing any of these files.

The future implementation phase must inspect the actual current source before editing.

## Implementation Strategy

Recommended implementation strategy:

```text
implementation_strategy=small_bounded_homepage_visual_pass
implementation_order=inspect_then_modify_then_verify
implementation_style=no_new_dependencies
implementation_data_strategy=preserve_existing_data_sources
implementation_behavior_strategy=preserve_existing_public_behavior
implementation_db_strategy=no_db_access
implementation_api_strategy=no_api_changes
```

Implementation should proceed in small, reviewable steps.

The visual pass should preserve all current public functionality.

The upgrade should improve appearance without introducing new backend behavior.

## Planned Homepage Work Units

### Work Unit 1 — Read-Only Source Inspection

```text
work_unit_1=read_only_source_inspection
work_unit_1_required=true
work_unit_1_source_changes=false
work_unit_1_goal=confirm_current_homepage_structure
```

Required inspection targets:

```text
inspect_app_page=true
inspect_public_tool_card=true
inspect_existing_search_behavior=true
inspect_existing_category_navigation=true
inspect_existing_save_compare_behavior=true
inspect_existing_responsive_classes=true
```

### Work Unit 2 — Homepage Hero Visual Layout

```text
work_unit_2=homepage_hero_visual_layout
work_unit_2_future_source_changes_allowed_only_after_phase_23e_approval=true
hero_headline=Find The Best AI Tools
hero_layout=centered_stack
hero_visual_style=light_first_premium_depth
hero_motion=none_or_subtle
```

Acceptance criteria:

```text
hero_headline_visible_desktop=true
hero_headline_visible_mobile=true
hero_subtitle_short=true
hero_above_fold=true
hero_no_heavy_animation=true
```

### Work Unit 3 — Premium Search Bar Visual Treatment

```text
work_unit_3=premium_search_bar_visual_treatment
work_unit_3_future_source_changes_allowed_only_after_phase_23e_approval=true
search_behavior_change=false
search_visual_priority=primary_homepage_action
search_existing_behavior_preserved=true
```

Acceptance criteria:

```text
search_keyboard_accessible=true
search_focus_state_visible=true
search_mobile_usable=true
search_no_algorithm_change=true
search_no_api_change=true
```

### Work Unit 4 — Suggestion And Category Chips

```text
work_unit_4=suggestion_and_category_chips_visuals
work_unit_4_future_source_changes_allowed_only_after_phase_23e_approval=true
suggestion_chips_behavior_change=false
category_taxonomy_change=false
category_routes_preserved=true
```

Acceptance criteria:

```text
chips_wrap_or_scroll_cleanly=true
chips_mobile_scan_clean=true
chips_tablet_scan_clean=true
chips_desktop_scan_clean=true
chips_no_taxonomy_change=true
```

### Work Unit 5 — AiFinder Assistant Preview Panel

```text
work_unit_5=aifinder_assistant_preview_panel
work_unit_5_future_source_changes_allowed_only_after_phase_23e_approval=true
assistant_visual_only=true
assistant_backend_authorized=false
assistant_runtime_behavior_authorized=false
assistant_beta_label_visible=true
```

Acceptance criteria:

```text
assistant_no_backend_call=true
assistant_no_runtime_behavior=true
assistant_does_not_block_search=true
assistant_secondary_to_search=true
```

### Work Unit 6 — Top Picks Visual Card Grid

```text
work_unit_6=top_picks_visual_card_grid
work_unit_6_future_source_changes_allowed_only_after_phase_23e_approval=true
top_picks_data_change=false
tool_links_preserved=true
save_compare_behavior_preserved=true
```

Acceptance criteria:

```text
top_picks_cards_scannable=true
top_picks_mobile_not_cramped=true
top_picks_existing_links_preserved=true
top_picks_no_data_source_change=true
```

### Work Unit 7 — Recently Added Compact Freshness Panel

```text
work_unit_7=recently_added_compact_freshness_panel
work_unit_7_future_source_changes_allowed_only_after_phase_23e_approval=true
recently_added_data_change=false
recently_added_compact=true
recently_added_not_overpower_top_picks=true
```

Acceptance criteria:

```text
recently_added_mobile_readable=true
recently_added_compact=true
recently_added_no_data_source_change=true
recently_added_view_all_if_existing_behavior_supports_it=true
```

### Work Unit 8 — Responsive Polish

```text
work_unit_8=responsive_polish
work_unit_8_future_source_changes_allowed_only_after_phase_23e_approval=true
desktop_1440=true
tablet_portrait_768=true
tablet_landscape_1024=true
mobile_390=true
```

Acceptance criteria:

```text
responsive_no_horizontal_overflow=true
responsive_hero_readable=true
responsive_search_primary=true
responsive_cards_not_cramped=true
responsive_chips_clean=true
```

### Work Unit 9 — Accessibility Preservation

```text
work_unit_9=accessibility_preservation
work_unit_9_future_source_changes_allowed_only_after_phase_23e_approval=true
semantic_headings_preserved=true
keyboard_navigation_preserved=true
focus_states_visible=true
text_contrast_checked=true
```

Acceptance criteria:

```text
accessibility_semantic_headings_preserved=true
accessibility_keyboard_navigation_preserved=true
accessibility_focus_states_visible=true
accessibility_buttons_have_accessible_names=true
accessibility_color_not_only_signal=true
accessibility_reduced_motion_respected=true
```

## Future Phase 23E Implementation Boundary

Recommended future implementation phase:

```text
Phase 23E — Homepage Visual Upgrade Implementation Gate
```

Phase 23E may authorize bounded source changes only if James explicitly approves.

Allowed future Phase 23E scope, if approved:

```text
phase_23e_allowed_homepage_visual_source_changes=true
phase_23e_allowed_public_component_visual_polish=true
phase_23e_allowed_responsive_class_adjustments=true
phase_23e_allowed_accessibility_preservation_fixes=true
```

Forbidden future Phase 23E scope unless separately approved:

```text
phase_23e_forbidden_api_route_changes=true
phase_23e_forbidden_db_reads=true
phase_23e_forbidden_db_mutations=true
phase_23e_forbidden_search_behavior_changes=true
phase_23e_forbidden_assistant_backend=true
phase_23e_forbidden_discovery_engine_reactivation=true
phase_23e_forbidden_package_install=true
phase_23e_forbidden_schema_migration=true
phase_23e_forbidden_type_generation=true
```

## Verification Plan For Future Implementation

Future implementation verification must include:

```text
future_verification_npm_run_check=true
future_verification_git_diff_check=true
future_verification_desktop_1440_qa=true
future_verification_tablet_portrait_768_qa=true
future_verification_tablet_landscape_1024_qa=true
future_verification_mobile_390_qa=true
future_verification_accessibility_review=true
future_verification_existing_behavior_smoke=true
future_verification_no_package_or_lockfile_change=true
future_verification_no_api_or_db_change=true
```

Required manual QA checklist:

```text
manual_qa_homepage_loads=true
manual_qa_search_visible_and_usable=true
manual_qa_category_navigation_still_works=true
manual_qa_tool_cards_links_still_work=true
manual_qa_save_still_works=true
manual_qa_compare_still_works=true
manual_qa_submit_entry_still_visible=true
manual_qa_no_mobile_horizontal_scroll=true
manual_qa_focus_states_visible=true
```

## Risk Controls

Risk controls:

```text
risk_control_keep_changes_small=true
risk_control_no_dependency_addition=true
risk_control_no_backend_behavior=true
risk_control_no_new_data_source=true
risk_control_no_public_claims_without_evidence=true
risk_control_preserve_existing_routes=true
risk_control_preserve_existing_interactions=true
risk_control_stop_on_unexpected_diff=true
```

## Commit Strategy For Future Implementation

Future implementation commit strategy:

```text
future_commit_strategy_single_bounded_visual_commit_preferred=true
future_commit_requires_verification_before_commit=true
future_commit_requires_gemini_review_if_scope_expands=true
future_push_requires_explicit_james_approval=true
```

## Explicit Non-Authorization

Phase 23D does not authorize:

- implementation,
- source changes,
- API route changes,
- UI behavior changes,
- live database reads,
- database mutation,
- candidate decision execution,
- approve-for-draft,
- public tool publishing,
- discovered tool writes,
- cleanup mutation,
- reset mutation,
- reopen mutation,
- evidence acquisition,
- crawler execution,
- LLM extraction,
- screenshot capture,
- raw asset storage,
- schema changes,
- type generation,
- package changes,
- lockfile changes,
- Discovery Engine operational reactivation,
- assistant backend behavior,
- assistant runtime behavior,
- search behavior changes,
- category taxonomy changes,
- production visual rollout.

## Preserved Discovery Engine Boundaries

These boundaries remain preserved:

```text
live_db_read_executed=false
mutation_executed=false
candidate_decision_executed=false
approve_for_draft_executed=false
publish_executed=false
cleanup_reset_reopen_executed=false
evidence_acquisition_executed=false
crawler_execution_executed=false
llm_extraction_executed=false
source_change_executed=false
api_route_change_executed=false
ui_behavior_change_executed=false
schema_change_executed=false
type_generation_executed=false
package_change_executed=false
lockfile_change_executed=false
```

## Verification Expectations

Phase 23D should verify:

```text
baseline_head_verified=true
working_tree_clean_before_phase=true
phase_23c_design_markers_present=true
implementation_plan_markers_present=true
future_scope_markers_present=true
candidate_file_plan_markers_present=true
work_unit_markers_present=true
future_phase_23e_boundary_markers_present=true
future_verification_markers_present=true
risk_control_markers_present=true
recommended_next_phase_marker_present=true
documentation_safety_scan_passed=true
whitespace_checks_passed=true
npm_run_check_passed=true
only_phase_23d_doc_changed=true
```

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 23D homepage visual upgrade implementation plan and James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 23D State

Phase 23D is complete when:

- Gemini approves this homepage visual upgrade implementation plan,
- the working tree contains only this Phase 23D document,
- documentation safety scan passes,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
