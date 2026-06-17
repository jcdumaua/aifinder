insert into public.discovered_tools (
  name,
  description,
  website,
  canonical_url,
  normalized_domain,
  slug,
  status,
  pricing,
  platforms,
  category,
  logo_url,
  discovery_score,
  source_id,
  run_id
)
values (
  'Discovery Queue Smoke Test',
  'Temporary candidate used to test the Discovery Engine review queue.',
  'https://example.com/discovery-queue-smoke-test',
  'https://example.com/discovery-queue-smoke-test',
  'example.com',
  'discovery-queue-smoke-test',
  'new',
  'Free + Paid',
  array['Web'],
  'Productivity',
  null,
  0.91,
  null,
  null
);
