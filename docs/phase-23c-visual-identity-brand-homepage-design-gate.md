# Phase 23C — Visual Identity Brand and Homepage Design Gate

## Phase Type

Docs-only visual identity brand and homepage design gate.

## Purpose

Phase 23C finalizes the brand direction, homepage section design, design constraints, and implementation-ready acceptance criteria before any code changes.

This phase accepts the Phase 23B visual identity and homepage upgrade planning gate.

This phase does not implement the homepage upgrade.

This phase does not change source code, API routes, UI behavior, database state, schema, package files, or lockfiles.

This phase preserves the Discovery Engine completion boundary.

## Baseline

Latest pushed baseline before this phase:

```text
f02ab60 Document visual identity homepage planning gate
```

Expected repository status before this phase:

```text
## main...origin/main
```

## Accepted Prior Planning

Phase 23C accepts Phase 23B as the visual identity and homepage upgrade planning gate.

Accepted markers:

```text
VISUAL_IDENTITY_HOMEPAGE_PLANNING_GATE_COMPLETE
VISUAL_IDENTITY_BUCKET_ACCEPTED
HOMEPAGE_UPGRADE_PLANNING_READY
NO_VISUAL_IMPLEMENTATION_AUTHORIZED
NO_DISCOVERY_ENGINE_OPERATIONAL_REACTIVATION_AUTHORIZED
visual_direction=clean_simple_fast_premium
preferred_theme_direction=light_first_with_premium_depth
homepage_priority=public_first_user_facing_polish
Phase 23C — Visual Identity Brand and Homepage Design Gate
```

## Design Gate Decision

Phase 23C records this design gate decision:

```text
VISUAL_IDENTITY_BRAND_HOMEPAGE_DESIGN_GATE_COMPLETE
BRAND_DIRECTION_FINALIZED_FOR_IMPLEMENTATION_PLANNING
HOMEPAGE_SECTION_DESIGN_FINALIZED_FOR_IMPLEMENTATION_PLANNING
IMPLEMENTATION_ACCEPTANCE_CRITERIA_DEFINED
NO_SOURCE_IMPLEMENTATION_AUTHORIZED
NO_UI_BEHAVIOR_CHANGE_AUTHORIZED
NO_DISCOVERY_ENGINE_OPERATIONAL_REACTIVATION_AUTHORIZED
```

## Final Brand Direction

Final brand direction:

```text
brand_positioning=trusted_ai_tools_discovery_platform
brand_feel=clean_simple_fast_premium
brand_personality=helpful_clear_modern_confident
brand_visual_energy=calm_premium_not_flashy
brand_trust_signal=curated_tools_clear_categories_fast_search
brand_primary_user_promise=find_the_best_ai_tools_faster
```

AiFinder should feel like a trustworthy AI tools discovery platform, not a noisy app directory.

The visual identity should communicate speed, clarity, and curation.

Premium polish should come from restraint, hierarchy, spacing, and subtle depth rather than heavy effects.

## Theme Direction

Theme direction:

```text
theme_direction=light_first
theme_background=clean_light_surface_with_subtle_depth
theme_accent=soft_blue_or_cyan_premium_accent
theme_glow=limited_search_and_hero_accent
theme_dark_mode_future_optional=true
theme_full_dark_redesign_authorized=false
```

Light-first remains the preferred implementation direction.

Dark-mode redesign is not authorized in this gate.

## Homepage Design Direction

Homepage design direction:

```text
homepage_design_direction=centered_discovery_experience
homepage_visual_priority=search_first
homepage_content_priority=curated_tool_discovery
homepage_density=clean_not_sparse
homepage_mobile_priority=fast_scan_and_search
homepage_desktop_priority=premium_hero_and_cards
```

The homepage should help users immediately understand what AiFinder does and start searching or browsing categories.

## Section Design Specification

### Hero Section

Hero design specification:

```text
hero_section_required=true
hero_headline=Find The Best AI Tools
hero_headline_style=large_centered_high_contrast
hero_subtitle_style=short_benefit_driven
hero_layout=centered_stack
hero_max_width=controlled_readable
hero_motion=subtle_or_none
hero_background=subtle_light_gradient_or_depth
hero_required_above_fold=true
```

Acceptance criteria:

```text
hero_acceptance_headline_visible_desktop=true
hero_acceptance_headline_visible_mobile=true
hero_acceptance_subtitle_not_overlong=true
hero_acceptance_no_layout_shift=true
hero_acceptance_no_heavy_animation=true
```

### Search Section

Search design specification:

```text
search_section_required=true
search_bar_visual=large_premium_rounded
search_bar_position=primary_action_under_hero
search_icon_visible=true
search_placeholder_clear=true
search_existing_behavior_preserved=true
search_behavior_change_authorized=false
```

Acceptance criteria:

```text
search_acceptance_keyboard_accessible=true
search_acceptance_mobile_usable=true
search_acceptance_existing_search_behavior_unchanged=true
search_acceptance_focus_state_visible=true
```

### Suggestion Chips

Suggestion chip design specification:

```text
suggestion_chips_required=true
suggestion_chips_style=soft_pills
suggestion_chips_purpose=guide_first_search
suggestion_chips_density=compact
suggestion_chips_behavior_change_authorized=false
```

Acceptance criteria:

```text
suggestion_acceptance_chips_wrap_or_scroll_cleanly=true
suggestion_acceptance_no_backend_dependency=true
suggestion_acceptance_no_search_logic_change=true
```

### Category Chips

Category chip design specification:

```text
category_chips_required=true
category_chips_style=horizontal_scan_pills
category_chips_icon_future_optional=true
category_chips_taxonomy_change_authorized=false
category_chips_existing_categories_preserved=true
```

Acceptance criteria:

```text
category_acceptance_existing_category_routes_preserved=true
category_acceptance_mobile_scan_clean=true
category_acceptance_tablet_scan_clean=true
category_acceptance_desktop_scan_clean=true
```

### AiFinder Assistant Preview

Assistant preview design specification:

```text
assistant_preview_required=true
assistant_preview_label=beta
assistant_preview_style=compact_premium_panel
assistant_preview_purpose=future_facing_guidance
assistant_backend_authorized=false
assistant_runtime_behavior_authorized=false
assistant_should_not_block_primary_search=true
```

Acceptance criteria:

```text
assistant_acceptance_visual_only=true
assistant_acceptance_no_backend_call=true
assistant_acceptance_no_runtime_assistant_behavior=true
assistant_acceptance_beta_label_visible=true
```

### Top Picks Section

Top Picks design specification:

```text
top_picks_required=true
top_picks_style=curated_card_grid
top_picks_card_density=balanced
top_picks_visual_priority=high
top_picks_data_change_authorized=false
top_picks_compare_entry_future_optional=true
```

Acceptance criteria:

```text
top_picks_acceptance_cards_scannable=true
top_picks_acceptance_existing_tool_links_preserved=true
top_picks_acceptance_no_data_source_change=true
top_picks_acceptance_mobile_not_cramped=true
```

### Recently Added Section

Recently Added design specification:

```text
recently_added_required=true
recently_added_style=compact_freshness_panel
recently_added_view_all_available=true
recently_added_data_change_authorized=false
recently_added_should_not_overpower_top_picks=true
```

Acceptance criteria:

```text
recently_added_acceptance_compact=true
recently_added_acceptance_freshness_clear=true
recently_added_acceptance_no_data_source_change=true
recently_added_acceptance_mobile_readable=true
```

### Featured Categories Section

Featured categories design specification:

```text
featured_categories_required=true
featured_categories_style=clean_card_or_chip_grid
featured_categories_icons_future_optional=true
featured_categories_taxonomy_change_authorized=false
```

Acceptance criteria:

```text
featured_categories_acceptance_scannable=true
featured_categories_acceptance_existing_categories_preserved=true
featured_categories_acceptance_mobile_tablet_desktop_ready=true
```

### Trust Or Quality Signal

Trust or quality signal design specification:

```text
trust_signal_required=true
trust_signal_style=small_subtle_quality_message
trust_signal_claims_must_be_truthful=true
trust_signal_no_unverified_metrics=true
```

Acceptance criteria:

```text
trust_signal_acceptance_no_fake_counts=true
trust_signal_acceptance_no_unverified_claims=true
trust_signal_acceptance_clear_value_message=true
```

## Visual System Constraints

Visual constraints:

```text
spacing_system=generous_but_compact
border_radius=soft_rounded
shadow_style=subtle_layered
gradient_usage=limited
glow_usage=limited_search_hero_only
animation_usage=subtle_optional
icon_style=modern_line_icons
card_style=clean_elevated
button_style=clear_primary_secondary
```

Forbidden visual patterns:

```text
forbid_overloaded_gradients=true
forbid_excessive_glow=true
forbid_tiny_mobile_cards=true
forbid_low_contrast_text=true
forbid_animation_required_for_understanding=true
forbid_visuals_that_hide_existing_functionality=true
```

## Responsive Design Requirements

Required responsive targets:

```text
desktop_1440=true
tablet_portrait_768=true
tablet_landscape_1024=true
mobile_390=true
```

Responsive acceptance criteria:

```text
responsive_acceptance_hero_readable=true
responsive_acceptance_search_primary=true
responsive_acceptance_chips_clean=true
responsive_acceptance_cards_not_cramped=true
responsive_acceptance_assistant_preview_secondary=true
responsive_acceptance_top_picks_scannable=true
responsive_acceptance_recently_added_compact=true
responsive_acceptance_no_horizontal_overflow=true
```

## Accessibility Requirements

Accessibility acceptance criteria:

```text
accessibility_acceptance_semantic_headings_preserved=true
accessibility_acceptance_keyboard_navigation_preserved=true
accessibility_acceptance_focus_states_visible=true
accessibility_acceptance_text_contrast_checked=true
accessibility_acceptance_buttons_have_accessible_names=true
accessibility_acceptance_color_not_only_signal=true
accessibility_acceptance_motion_not_required=true
accessibility_acceptance_reduced_motion_respected=true
```

The visual upgrade must not reduce accessibility.

## Existing Functionality Preservation

Existing behavior must be preserved unless a later implementation phase explicitly approves a change:

```text
existing_search_behavior_preserved=true
existing_category_navigation_preserved=true
existing_tool_card_links_preserved=true
existing_save_behavior_preserved=true
existing_compare_behavior_preserved=true
existing_modal_behavior_preserved=true
existing_submit_entry_preserved=true
existing_admin_behavior_preserved=true
```

## Implementation-Ready Acceptance Criteria

A future implementation phase should be considered acceptable only if:

```text
implementation_acceptance_homepage_sections_match_plan=true
implementation_acceptance_existing_behavior_preserved=true
implementation_acceptance_no_api_change_unless_approved=true
implementation_acceptance_no_db_change=true
implementation_acceptance_no_discovery_engine_reactivation=true
implementation_acceptance_no_package_change_unless_approved=true
implementation_acceptance_desktop_tablet_mobile_qa_passed=true
implementation_acceptance_accessibility_review_passed=true
implementation_acceptance_npm_run_check_passed=true
```

## Recommended Implementation Sequence

Recommended next phases:

```text
phase_23d_homepage_visual_upgrade_implementation_plan
phase_23e_homepage_visual_upgrade_implementation_gate
phase_23f_homepage_visual_upgrade_qa_accessibility_review
phase_23g_homepage_visual_upgrade_closure_gate
```

Recommended next phase:

```text
Phase 23D — Homepage Visual Upgrade Implementation Plan
```

Purpose for Phase 23D:

```text
Translate the Phase 23C design gate into a precise implementation plan before code changes.
```

## Explicit Non-Authorization

Phase 23C does not authorize:

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

Phase 23C should verify:

```text
baseline_head_verified=true
working_tree_clean_before_phase=true
phase_23b_planning_markers_present=true
design_gate_markers_present=true
brand_direction_markers_present=true
section_design_markers_present=true
responsive_acceptance_markers_present=true
accessibility_acceptance_markers_present=true
implementation_acceptance_markers_present=true
recommended_next_phase_marker_present=true
documentation_safety_scan_passed=true
whitespace_checks_passed=true
npm_run_check_passed=true
only_phase_23c_doc_changed=true
```

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 23C visual identity brand and homepage design gate and James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 23C State

Phase 23C is complete when:

- Gemini approves this visual identity brand and homepage design gate,
- the working tree contains only this Phase 23C document,
- documentation safety scan passes,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
