# Phase 26TS — RLS and Policy Verification Plan

## Bound baseline

`b95d74f3e5596ed5efb1522d5563e07d98fdb089`

## Objective

Verify intended row-level security and policy coverage without mutation and without exposing database credentials or row data.

## Static-first scope

Before any live database read:

1. inventory committed migrations and policy definitions;
2. map tables to RLS enablement statements;
3. map policies to roles and operations;
4. identify tables with missing or ambiguous policies;
5. identify service-role bypass assumptions;
6. identify any migration ordering or rollback concerns.

## Controlled live-read scope

Live database inspection may occur only under a separately approved execution gate and must be limited to metadata queries that verify:

- RLS enabled state;
- policy names;
- covered commands;
- target roles;
- permissive or restrictive mode;
- table and schema identity.

## Explicit prohibitions

- no row-value reads;
- no inserts, updates, deletes, truncates, or DDL;
- no policy creation, alteration, or deletion;
- no migration execution;
- no Supabase database push;
- no secret or connection-string output;
- no response body containing user or tool records.

## Pass criteria

- every launch-relevant table has reviewed RLS status;
- policy coverage matches intended roles and operations;
- public access is deny-by-default where required;
- service-role bypass remains isolated to approved server contexts;
- no unexpected permissive policy remains unresolved.

## Current state

`RLS_POLICY_VERIFICATION_PLANNED_NOT_EXECUTED`
