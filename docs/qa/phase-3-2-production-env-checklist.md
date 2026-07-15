# Phase 3.2.1 — Production Environment Variable Checklist (Turnstile)

**Date:** 2026-07-15
**Phase:** 3.2.1 — Cloudflare Turnstile Configuration Verification
**Status:** Not performed

---

## Purpose

This checklist verifies that Cloudflare Turnstile environment variables are correctly configured before deploying Phase 3.2.1 to production. Turnstile protects the public booking form from automated abuse.

---

## Environment Variables

### TURNSTILE_ENABLED

| Property | Value |
|----------|-------|
| Type | `boolean` (`"true"` or `"false"`) |
| Required | No (has a default) |
| Default | `false` |
| Description | Master switch for Turnstile verification on the public booking form |

### TURNSTILE_SECRET_KEY

| Property | Value |
|----------|-------|
| Type | `string` (server-side secret) |
| Required | **Yes, when `TURNSTILE_ENABLED=true`** |
| Description | Server-side secret key used to verify the Turnstile token with Cloudflare's API |
| Sensitivity | **Secret — never expose to the client, never commit to source control** |

### NEXT_PUBLIC_TURNSTILE_SITE_KEY

| Property | Value |
|----------|-------|
| Type | `string` (client-side site key) |
| Required | **Yes, when `TURNSTILE_ENABLED=true`** |
| Description | Client-side site key rendered in the Turnstile widget on the booking form |
| Sensitivity | Public (embedded in client HTML), but should still be set intentionally |

---

## Behavior Matrix

| `TURNSTILE_ENABLED` | `TURNSTILE_SECRET_KEY` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Behavior |
|----------------------|------------------------|----------------------------------|----------|
| `false` | not set | not set | Turnstile widget is **not rendered**. Booking form submits without any CAPTCHA verification. This is the default for local development. |
| `false` | set | set | Turnstile is **disabled** despite keys being present. The keys are ignored. Useful for staging environments where Turnstile is not yet configured. |
| `true` | set | set | Turnstile widget is **rendered** on the booking form. Token is verified server-side on submission. Booking is rejected if verification fails. |
| `true` | not set | set | **Fail-closed.** Server-side verification cannot complete without the secret key. All booking submissions will be rejected. |
| `true` | set | not set | **Broken widget.** The Turnstile widget cannot render without the site key. Users see a broken or missing widget. Server-side verification also fails. |
| `true` | not set | not set | **Fail-closed.** Neither key is present. Widget does not render. Server-side verification fails. All bookings rejected. |

---

## Fail-Closed Behavior

When `TURNSTILE_ENABLED=true` but the secret key is missing or invalid:

- The server-side verification endpoint **rejects all booking submissions**.
- The user receives an error message indicating that the security check could not be completed.
- **No booking is created** when verification cannot be performed.
- This is intentional: it is safer to block all bookings than to allow unverified submissions through a misconfigured form.

When `TURNSTILE_ENABLED=true` but the site key is missing:

- The Turnstile widget does not render on the client.
- No token is generated, so server-side verification fails.
- All booking submissions are rejected.

---

## Pre-requisites

- [ ] Access to the production environment's environment variable configuration (Supabase Edge Functions, Vercel, or hosting platform)
- [ ] Access to the staging environment's environment variable configuration
- [ ] Cloudflare Turnstile site key and secret key obtained from the Cloudflare dashboard

---

## Checklist — Local Development

- [ ] `TURNSTILE_ENABLED` is `false` (or not set — defaults to `false`)
- [ ] `TURNSTILE_SECRET_KEY` is **not set**
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is **not set**
- [ ] Booking form loads without any Turnstile widget
- [ ] Booking form submits successfully without CAPTCHA verification
- [ ] No errors in the browser console related to Turnstile

---

## Checklist — Staging / Production

- [ ] `TURNSTILE_ENABLED` is set to `true`
- [ ] `TURNSTILE_SECRET_KEY` is set to the secret key from Cloudflare dashboard
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set to the site key from Cloudflare dashboard
- [ ] Booking form renders the Turnstile widget visibly
- [ ] Complete a test booking — verify the Turnstile challenge completes
- [ ] Verify the booking is created successfully after passing Turnstile
- [ ] Submit the form without completing the Turnstile challenge — verify the booking is rejected
- [ ] Verify no secret key values appear in browser network requests or client-side bundles

---

## Verification Steps

### 1. Confirm variable values

```bash
# On the production server or via the hosting platform's dashboard:
echo $TURNSTILE_ENABLED
echo $TURNSTILE_SECRET_KEY | head -c 10  # Print only first 10 chars for verification
echo $NEXT_PUBLIC_TURNSTILE_SITE_KEY | head -c 10
```

**Do not print full secret values in logs, chat, or tickets.**

### 2. Verify client-side behavior

1. Open the public booking page in a browser.
2. Open DevTools → Network tab.
3. Verify the Turnstile widget loads (look for requests to `challenges.cloudflare.com`).
4. Verify the site key in the page source matches `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

### 3. Verify server-side behavior

1. Submit a booking with a valid Turnstile token — should succeed.
2. Submit a booking with a missing or invalid token — should be rejected with an appropriate error.
3. Check server logs for verification request to Cloudflare's `siteverify` endpoint.

### 4. Verify fail-closed behavior

1. Temporarily set `TURNSTILE_SECRET_KEY` to an invalid value.
2. Attempt a booking — verify it is rejected.
3. Restore the correct secret key.
4. Attempt a booking — verify it succeeds.

---

## Security Notes

- **Never commit secret keys to source control.** Use environment variable injection from the hosting platform.
- **Never log secret keys.** If logging Turnstile verification, log only success/failure status, not the key itself.
- **Rotate keys if compromised.** If a secret key is exposed, generate a new one in the Cloudflare dashboard and update the environment variable immediately.
- **Site keys are public.** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is embedded in client HTML and is not secret. However, it should be scoped to your domain in the Cloudflare dashboard to prevent use on other sites.

---

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---------|-------------|------------|
| Turnstile widget does not appear | `TURNSTILE_ENABLED` is `false` or site key is missing | Set `TURNSTILE_ENABLED=true` and verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| All bookings rejected with security error | Secret key missing or invalid | Verify `TURNSTILE_SECRET_KEY` matches the Cloudflare dashboard value |
| Widget appears but always fails | Site key does not match secret key | Ensure both keys are from the same Turnstile widget in Cloudflare |
| Widget works in dev but not production | Domain not allowlisted in Cloudflare | Add the production domain to the Turnstile widget's allowed domains |

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Configurator | | | |
| Reviewer | | | |

---

**Not performed.** Each item must be verified by a human operator.
