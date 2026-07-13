# AiFinder Phase 25YJ — Revision CCCLXII — GAP-063 Request Recipient Authority Input Requirements

## Purpose

Define the minimum non-secret human input required to identify and validate the recipient of the Phase 25YC presenter-and-recipient request.

## Required input fields

A future authorized human response must provide:

1. **Request recipient identity or role**
   - A non-secret person name or governance role permitted to receive the Phase 25YC request.

2. **Authority basis**
   - A concise statement explaining why that person or role may provide or coordinate presenter, recipient, recipient-authority, and presentation-context assignments.

3. **Presentation context**
   - One of: `CURRENT_GOVERNANCE_CHAT`, `DIRECT_CHAT`, `MEETING`, `GOVERNANCE_DOCUMENT`, or `OTHER_REVIEWED_CONTEXT`.

4. **Authority attestation source**
   - A non-secret description of who or what governance record confirms the authority basis.
   - No private link, account identifier, project reference, credential, or secret value is required.

## Acceptance requirements

The input must be:

- Explicit and attributable to an authorized human.
- Non-secret and independently reviewable.
- Specific enough to distinguish identity, authority, context, and attestation source.
- Free of credentials, private URLs, account identifiers, project references, screenshots, environment values, and database details.
- Non-authorizing by itself.

## Current state

- Authority input requested: `NO`
- Authority input received: `NO`
- Accepted fields: `0`
- Request recipient identified: `NO`
- Recipient authority verified: `NO`
- Presentation context approved: `NO`

## Result

The request-recipient authority requirements are defined. No input has been requested or received.
