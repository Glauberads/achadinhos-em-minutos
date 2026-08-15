# Early Access access-control architecture

## Scope

EA-1 establishes the database and shared contracts for a closed beta. It does
not implement the public form, frontend guards, billing, email delivery, or an
administrative UI.

Four profile concepts remain independent:

| Field | Purpose | Authority |
| --- | --- | --- |
| `profiles.role` | Tenant/application membership role | Future tenant authorization service |
| `profiles.access_status` | Product-access gate | Trusted Early Access API only |
| `profiles.subscription_status` | Billing lifecycle | Trusted billing/webhook service only |
| `profiles.platform_role` | Global platform administration | Superadmin bootstrap/governance only |

No value in one field implies authority in another. In particular,
`platform_role = 'superadmin'` is never written by the Early Access workflow,
and `access_status` is not a substitute for Superadmin.

## Sources of truth

- `early_access_applications.status` is the acquisition/application workflow.
- `profiles.access_status` is the platform-access workflow after a profile
  exists.
- The future `GET /api/me/access` response is the only frontend source of truth
  for routing. Frontend code must not build authorization by reading profiles
  directly with the Supabase client.
- Invite validation and consumption are server-side only.

## Application states and transitions

Application states are `WAITLIST`, `INVITED`, `APPROVED`, and `REJECTED`.

```text
new application -> WAITLIST
WAITLIST        -> INVITED | APPROVED | REJECTED
INVITED         -> APPROVED | REJECTED
REJECTED        -> WAITLIST (explicit reconsideration)
APPROVED        -> terminal
```

The database trigger rejects every other transition and maintains
`invited_at`, `approved_at`, and `rejected_at`.

## Platform access states

Platform access states are `WAITLIST`, `INVITED`, `BETA_TESTER`, `ACTIVE`,
`SUSPENDED`, and `BANNED`.

```text
visitor -> application WAITLIST
application approval/invite -> profile INVITED
authenticated onboarding/invite redemption -> BETA_TESTER | ACTIVE
trusted enforcement -> SUSPENDED | BANNED
```

Legacy `ADMIN` and `INTERNAL` access-status values are not platform
administration. The EA-1 preflight blocks when such data exists so it can be
resolved explicitly instead of silently promoting or demoting a user.

## Authorization model

- `anon` and `authenticated` have no privileges or RLS policies on
  `early_access_applications`, `invite_codes`, or `invite_code_redemptions`.
- Clients have no direct UPDATE privilege or UPDATE policy on `profiles`.
- The access-status trigger raises SQLSTATE `42501` for untrusted changes.
- Trusted server operations use `service_role`; migrations and controlled SQL
  gates use the `postgres` session.
- No current profile fields are approved for direct client self-service.
  Future display-name/avatar/preferences updates require a narrow API or RPC.

## Invite workflow

Invite codes are stored in the legacy `invite_codes` table but are never
listed or validated by clients. The server-only
`redeem_early_access_invite(code, user_id)` function:

1. verifies the profile;
2. locks the invite row with `FOR UPDATE`;
3. rejects repeat redemption by the same user;
4. rejects expired or exhausted codes;
5. increments usage;
6. updates the profile to `BETA_TESTER` or `ACTIVE`;
7. records an immutable redemption row;
8. commits all operations atomically.

The row lock serializes concurrent attempts for the final use. After the first
transaction increments `current_uses`, the second transaction resumes, sees an
exhausted invite, and fails without changing the profile.

## Future API contracts

EA-1 defines shared Zod contracts for:

- `EarlyAccessApplicationCreate`
- `EarlyAccessApplicationStatus`
- `InviteRedeemRequest`
- `AccessState`
- `MeAccessResponse`

The future `GET /api/me/access` response separates authentication, access,
billing, tenant role, and global platform role:

```json
{
  "authenticated": true,
  "accessStatus": "BETA_TESTER",
  "subscriptionStatus": null,
  "role": "member",
  "platformRole": null
}
```

## Redirect precedence for the future frontend guard

Precedence is evaluated from top to bottom:

1. No valid session -> `/login`
2. `platformRole = superadmin` -> `/system/operation-center`
3. `SUSPENDED` or `BANNED` -> `/access-blocked`
4. `WAITLIST` -> `/early-access/status`
5. `INVITED` -> `/early-access/accept`
6. `BETA_TESTER` or `ACTIVE` -> `/dashboard`
7. Missing/unknown state -> fail closed at `/access-blocked`

Superadmin routing has precedence only after authentication. It does not mutate
or replace `access_status`.

## Known deferred behavior

- The current `/early-access` route remains a placeholder in EA-1.
- The current login redirect sends ordinary users to `/checkout`; this is
  documented as incorrect but intentionally unchanged in EA-1.
- Checkout, Asaas, subscription enforcement, Turnstile, emails, admin UI, and
  frontend redirect guards remain deferred to later authorized phases.

## Administrative workflow

A future authenticated administrative API will list applications and perform
explicit invite/approve/reject actions using `service_role`. It must record an
audit event for every transition. Neither tenant roles nor profile
`access_status` authorize global administration; that decision uses
`platform_role` through the existing Superadmin middleware.
