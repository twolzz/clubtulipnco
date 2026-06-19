# Secure subscribers + external Payhip embed

## Task 1 — RLS hardening for `public.subscribers`

Current state: one `INSERT` policy `with check (true)` for `anon, authenticated`; no `SELECT`/`UPDATE`/`DELETE` policies (so those are already denied by RLS). The linter still flags the permissive `true` check and there's no admin read path. Fix both.

### Migration

1. **Add an admin role system** (per project security rules, roles live in their own table — never on profiles):
   - `app_role` enum: `admin`, `user`
   - `public.user_roles (id, user_id → auth.users, role, created_at)` with unique `(user_id, role)`
   - `public.has_role(_user_id uuid, _role app_role)` — `SECURITY DEFINER`, `STABLE`, `SET search_path = public` to avoid recursive RLS
   - Grants: `SELECT` to `authenticated`, `ALL` to `service_role`
   - RLS on `user_roles`: users can read their own roles; only admins can manage roles

2. **Rewrite `subscribers` policies**:
   - Drop the existing permissive insert policy
   - `INSERT` for `anon, authenticated` with a narrowed `WITH CHECK`:
     - `length(trim(first_name)) between 1 and 60`
     - `length(email) between 3 and 255`
     - `email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'`
     (replaces the "always true" check so the linter clears, and blocks junk inserts)
   - `SELECT` for `authenticated` using `public.has_role(auth.uid(), 'admin')`
   - `UPDATE` / `DELETE` for `authenticated` using `public.has_role(auth.uid(), 'admin')`
   - Grants stay: `INSERT` for `anon, authenticated`; add `SELECT, UPDATE, DELETE` for `authenticated`; `ALL` for `service_role`
   - Add a `unique` index on `lower(email)` if not already enforced (current schema has `unique(email)` — keep)

Result: anonymous signups still work from the site and the Payhip embed; only signed-in admins (rows in `user_roles` with `role = 'admin'`) can read or manage the list; linter's "always true" warning is resolved.

> Admin promotion is a one-time manual step done via the backend (insert a row into `user_roles` for your auth user). I'll note this in the response after the migration runs — no UI for it in this task.

## Task 2 — Standalone Payhip embed

Single self-contained HTML block. No build step, no framework, no external CSS. Uses the Supabase JS client from a CDN (`esm.sh`) so the insert path mirrors the in-app form and the unique-email error is handled cleanly.

- Hardcoded **publishable** anon key and project URL (safe to expose; RLS protects the table).
- Scoped CSS via a unique wrapper class (`tc-embed-*`) so it cannot collide with Payhip's own styles.
- States: **idle → loading ("Joining…" + small spinner) → success message** (form replaced) **/ error toast inline under the form**.
- Validation: required first name (1–60), valid email shape, both trimmed; email lowercased before insert.
- Duplicate detection: `error.code === '23505'` → "You're already on the list!"
- De Stijl styling: cream `#F6F2E7` panel, 4px `#333` border, 16px radius, hard `12px 12px 0 #E05A36` shadow, Sun Yellow `#F2B73F` button with hard `6px 6px 0 #333` shadow, system sans-serif stack.

### Final embed code (delivered after the migration runs)

```html
<!-- Tulip & Co. — Join the Club (Payhip embed) -->
<div class="tc-embed">
  <div class="tc-embed-card">
    <h3 class="tc-embed-title">Join the Club!</h3>
    <p class="tc-embed-sub">San Diego pop-up dates, new Miffy arrivals, and Dutch design drops — straight to your inbox.</p>
    <form class="tc-embed-form" novalidate>
      <input class="tc-embed-input" type="text" name="first_name" placeholder="First name" autocomplete="given-name" maxlength="60" required />
      <input class="tc-embed-input" type="email" name="email" placeholder="Email address" autocomplete="email" maxlength="255" required />
      <button class="tc-embed-btn" type="submit">Subscribe</button>
      <p class="tc-embed-error" role="alert" hidden></p>
    </form>
    <div class="tc-embed-success" role="status" hidden>
      <p class="tc-embed-success-title">Welcome to the club!</p>
      <p class="tc-embed-success-body">Keep an eye on your inbox for our next San Diego pop-up date.</p>
    </div>
  </div>
</div>

<style>
  .tc-embed { all: initial; display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif; color: #333; }
  .tc-embed *, .tc-embed *::before, .tc-embed *::after { box-sizing: border-box; }
  .tc-embed-card { max-width: 460px; margin: 24px auto; background: #F6F2E7; border: 4px solid #333; border-radius: 16px; box-shadow: 12px 12px 0 #E05A36; padding: 28px; }
  .tc-embed-title { margin: 0 0 8px; font-size: 28px; font-weight: 800; letter-spacing: -0.01em; }
  .tc-embed-sub { margin: 0 0 20px; font-size: 15px; line-height: 1.5; color: #333; opacity: .85; }
  .tc-embed-form { display: flex; flex-direction: column; gap: 12px; }
  .tc-embed-input { width: 100%; padding: 14px 16px; font-size: 16px; font-family: inherit; color: #333; background: #fff; border: 3px solid #333; border-radius: 12px; outline: none; }
  .tc-embed-input:focus { box-shadow: 4px 4px 0 #3D6E97; }
  .tc-embed-btn { margin-top: 4px; padding: 14px 18px; font-size: 16px; font-weight: 800; font-family: inherit; color: #333; background: #F2B73F; border: 3px solid #333; border-radius: 12px; box-shadow: 6px 6px 0 #333; cursor: pointer; transition: transform .05s ease, box-shadow .05s ease; }
  .tc-embed-btn:hover { transform: translate(-1px,-1px); box-shadow: 7px 7px 0 #333; }
  .tc-embed-btn:active { transform: translate(2px,2px); box-shadow: 3px 3px 0 #333; }
  .tc-embed-btn[disabled] { opacity: .75; cursor: not-allowed; }
  .tc-embed-error { margin: 6px 2px 0; font-size: 14px; font-weight: 700; color: #E05A36; }
  .tc-embed-success-title { margin: 0 0 6px; font-size: 22px; font-weight: 800; }
  .tc-embed-success-body { margin: 0; font-size: 15px; line-height: 1.5; }
  .tc-embed-spinner { display: inline-block; width: 14px; height: 14px; margin-right: 8px; border: 2px solid #333; border-top-color: transparent; border-radius: 50%; vertical-align: -2px; animation: tc-spin .7s linear infinite; }
  @keyframes tc-spin { to { transform: rotate(360deg); } }
</style>

<script type="module">
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const SUPABASE_URL = "https://nrrvkhnmaivqgaeqvcdp.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xrumNC9vci5ygzo30FBTmA_S6-mBN_P";
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const root = document.currentScript.previousElementSibling.previousElementSibling.previousElementSibling || document.querySelector(".tc-embed");
  const card = document.querySelector(".tc-embed .tc-embed-card");
  const form = card.querySelector(".tc-embed-form");
  const btn  = card.querySelector(".tc-embed-btn");
  const err  = card.querySelector(".tc-embed-error");
  const ok   = card.querySelector(".tc-embed-success");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showError(msg){ err.textContent = msg; err.hidden = false; }
  function clearError(){ err.hidden = true; err.textContent = ""; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    const first_name = form.first_name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    if (first_name.length < 1 || first_name.length > 60) return showError("Please enter your first name.");
    if (!emailRe.test(email) || email.length > 255) return showError("Please enter a valid email address.");

    btn.disabled = true;
    btn.innerHTML = '<span class="tc-embed-spinner"></span>Joining…';

    const { error } = await supabase.from("subscribers").insert({ first_name, email });

    if (error) {
      btn.disabled = false;
      btn.textContent = "Subscribe";
      showError(error.code === "23505" ? "You're already on the list!" : "Something went wrong — please try again.");
      return;
    }

    form.hidden = true;
    ok.hidden = false;
  });
</script>
```

## Technical notes

- The publishable key + URL in the embed are safe to expose — that's their intended use; the security boundary is the RLS policy set above (insert-only for `anon`, admin-gated reads/updates/deletes).
- Email is lowercased and trimmed client-side; the DB-level `unique(email)` index ensures dedupe even if a stray uppercase variant slips through.
- The embed uses `esm.sh` so Payhip needs no build tooling — single paste-in block.
- No analytics, no third-party trackers, no font CDN — keeps the embed lightweight and CSP-friendly on most host sites.
- After the migration runs, you'll need one `INSERT INTO public.user_roles (user_id, role) VALUES ('<your auth user id>', 'admin')` to grant yourself read access; I'll surface that as a follow-up step (not part of this plan's automated work).
