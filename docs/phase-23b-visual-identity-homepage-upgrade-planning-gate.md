# Phase 23B — Visual Identity and Homepage Upgrade Planning Gate

## Phase Type

Docs-only visual identity and homepage upgrade planning gate.

## Purpose

Phase 23B defines the visual identity and homepage upgrade plan for AiFinder before implementation.

This phase accepts the Phase 23A product bucket transition decision and expands the selected bucket into a safe planning document.

This phase does not implement the visual upgrade.

This phase does not change source code, API routes, UI behavior, database state, schema, package files, or lockfiles.

This phase preserves the Discovery Engine completion boundary.

## Baseline

Latest pushed baseline before this phase:

```text
3cc39e8 Document product bucket transition planning gate
```

Expected repository status before this phase:

```text
## main...origin/main
```

## Accepted Prior Transition

Phase 23B accepts Phase 23A as the product bucket transition planning gate.

Accepted markers:

```text
PRODUCT_BUCKET_TRANSITION_GATE_COMPLETE
DISCOVERY_ENGINE_COMPLETION_HANDOFF_ACCEPTED
NO_DISCOVERY_ENGINE_OPERATIONAL_REACTIVATION_AUTHORIZED
NEXT_PRODUCT_BUCKET_SELECTED
selected_product_bucket=bucket_a_visual_identity_homepage_upgrade
Phase 23B — Visual Identity and Homepage Upgrade Planning Gate
```

## Planning Decision

Phase 23B records this planning decision:

```text
VISUAL_IDENTITY_HOMEPAGE_PLANNING_GATE_COMPLETE
VISUAL_IDENTITY_BUCKET_ACCEPTED
HOMEPAGE_UPGRADE_PLANNING_READY
NO_VISUAL_IMPLEMENTATION_AUTHORIZED
NO_DISCOVERY_ENGINE_OPERATIONAL_REACTIVATION_AUTHORIZED
```

## Product Direction

Preferred direction:

```text
visual_direction=clean_simple_fast_premium
preferred_theme_direction=light_first_with_premium_depth
homepage_priority=public_first_user_facing_polish
implementation_status=not_authorized
```

The visual identity should make AiFinder feel clean, simple, fast, and premium.

The homepage should prioritize clarity, trust, and fast discovery of AI tools.

The design should remain practical for the current Next.js app and should not require a full rebuild.

## Homepage Upgrade Goals

Primary homepage goals:

```text
homepage_goal_clear_value_proposition=true
homepage_goal_fast_tool_discovery=true
homepage_goal_premium_visual_polish=true
homepage_goal_mobile_tablet_desktop_quality=true
homepage_goal_no_feature_overload=true
homepage_goal_preserve_existing_functionality=true
```

The homepage should make it obvious that AiFinder helps users find the best AI tools.

The homepage should keep search prominent.

The homepage should keep categories easy to scan.

The homepage should make tool recommendations feel curated.

The homepage should feel polished without becoming heavy or confusing.

## Proposed Homepage Structure

Planned homepage structure:

```text
section_hero=true
section_search=true
section_suggestion_chips=true
section_category_chips=true
section_aifinder_assistant_preview=true
section_top_picks=true
section_recently_added=true
section_featured_categories=true
section_trust_or_quality_signal=true
```

### Hero

Hero planning:

```text
hero_headline=Find The Best AI Tools
hero_subtitle=short_clear_benefit_statement
hero_layout=centered
hero_density=compact_premium
hero_motion=limited_subtle
```

The hero should be direct, centered, and easy to understand.

### Search

Search planning:

```text
search_priority=primary_homepage_action
search_visual_style=large_premium_search_bar
search_behavior_change_authorized=false
search_existing_behavior_preserved=true
```

The search bar should look more premium while preserving existing behavior until a later implementation phase explicitly authorizes changes.

### Suggestion Chips

Suggestion chip planning:

```text
suggestion_chips_visible=true
suggestion_chips_purpose=guide_first_search
suggestion_chips_behavior_change_authorized=false
```

Suggestion chips should help users start exploring without adding new backend behavior.

### Category Chips

Category chip planning:

```text
category_chips_visible=true
category_chips_horizontal_scan=true
category_chips_icons_future_optional=true
category_taxonomy_change_authorized=false
```

Category chips should remain simple and scannable.

### AiFinder Assistant Preview

Assistant preview planning:

```text
aifinder_assistant_preview_visible=true
assistant_preview_label=beta
assistant_runtime_behavior_authorized=false
assistant_backend_authorized=false
```

The assistant panel can be presented as a future-facing visual preview, but this planning gate does not authorize backend assistant behavior.

### Top Picks

Top Picks planning:

```text
top_picks_visible=true
top_picks_card_polish=true
top_picks_compare_entry_future_optional=true
top_picks_data_change_authorized=false
```

Top Picks should look curated and premium.

### Recently Added

Recently Added planning:

```text
recently_added_visible=true
recently_added_density=compact
recently_added_view_all_available=true
recently_added_data_change_authorized=false
```

Recently Added can help show freshness without changing data behavior.

## Visual Identity Direction

Visual identity direction:

```text
brand_feel=modern_clear_trustworthy_premium
visual_density=clean_breathable
shape_language=soft_rounded
shadow_language=subtle_depth
glow_usage=limited_premium_accent
icon_style=modern_line_icons
typography_direction=clear_high_readability
animation_direction=limited_useful_not_distracting
```

The visual system should not feel overloaded.

Premium polish should come from spacing, hierarchy, depth, and restraint.

## Component Planning Inventory

Future implementation should likely touch these public-facing areas, but this phase does not authorize code changes:

```text
potential_component_homepage=true
potential_component_public_tool_card=true
potential_component_category_chips=true
potential_component_search_bar=true
potential_component_top_picks=true
potential_component_recently_added=true
potential_component_assistant_preview=true
potential_component_responsive_layout=true
```

## Responsive QA Plan

Future implementation should include responsive QA for:

```text
desktop_1440=true
tablet_portrait_768=true
tablet_landscape_1024=true
mobile_390=true
```

Responsive QA expectations:

```text
hero_readable_on_mobile=true
search_accessible_on_mobile=true
chips_wrap_or_scroll_cleanly=true
tool_cards_not_cramped=true
assistant_preview_not_overpowering=true
top_picks_scannable=true
recently_added_compact=true
```

## Accessibility Planning

Future implementation should preserve or improve:

```text
text_contrast_checked=true
keyboard_navigation_preserved=true
focus_states_visible=true
semantic_headings_preserved=true
buttons_have_accessible_names=true
color_not_only_signal=true
motion_reduced_when_needed=true
```

The upgrade should not trade accessibility for visual polish.

## Implementation Sequencing Recommendation

Recommended future sequence:

```text
phase_23c_visual_identity_brand_homepage_design_gate
phase_23d_homepage_upgrade_implementation_plan
phase_23e_homepage_visual_upgrade_implementation_gate
phase_23f_homepage_visual_upgrade_qa_accessibility_review
phase_23g_homepage_visual_upgrade_closure_gate
```

Recommended next phase:

```text
Phase 23C — Visual Identity Brand and Homepage Design Gate
```

Purpose for Phase 23C:

```text
Finalize the visual direction, homepage sections, design constraints, and implementation-ready acceptance criteria before code changes.
```

## Explicit Non-Authorization

Phase 23B does not authorize:

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
- search behavior changes,
- taxonomy changes,
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

Phase 23B should verify:

```text
baseline_head_verified=true
working_tree_clean_before_phase=true
phase_23a_transition_markers_present=true
planning_markers_present=true
selected_visual_direction_marker_present=true
homepage_structure_markers_present=true
responsive_qa_plan_markers_present=true
accessibility_plan_markers_present=true
recommended_next_phase_marker_present=true
documentation_safety_scan_passed=true
whitespace_checks_passed=true
npm_run_check_passed=true
only_phase_23b_doc_changed=true
```

## Commit And Push Boundary

No commit may occur until Gemini approves this Phase 23B visual identity and homepage upgrade planning gate and James explicitly approves the commit.

No push may occur until James explicitly approves the push.

## Final Phase 23B State

Phase 23B is complete when:

- Gemini approves this visual identity and homepage upgrade planning gate,
- the working tree contains only this Phase 23B document,
- documentation safety scan passes,
- whitespace checks pass,
- npm run check passes,
- James explicitly approves commit after Gemini approval,
- no commit is made before Gemini approval and James approval,
- no push is made without explicit James push approval.
