delete from public.discovery_audit_events
where discovered_tool_id in (
  select id from public.discovered_tools
  where slug = 'discovery-queue-smoke-test'
);

delete from public.discovery_duplicate_candidates
where discovered_tool_id in (
  select id from public.discovered_tools
  where slug = 'discovery-queue-smoke-test'
);

delete from public.discovery_evidence
where discovered_tool_id in (
  select id from public.discovered_tools
  where slug = 'discovery-queue-smoke-test'
);

delete from public.discovered_tools
where slug = 'discovery-queue-smoke-test';
