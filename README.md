# শুঁটকি কর্নার (Shutki Corner)

A mobile-first e-commerce site for a Bangladeshi dried-fish business, built with
Next.js 14 (App Router), TypeScript, Tailwind CSS, and Prisma/PostgreSQL.

## Status — read this first

This repository is a working, runnable **foundation**, not a fully polished
production deployment. It implements every core flow end-to-end (browse →
cart → checkout → order → delivery → review) with real validation, stock
control, and moderation — but some admin conveniences (bulk product import,
banner management UI, analytics charts) are intentionally left as documented
extension points rather than built out, so nothing here overstates what
exists. Search this file for "Not yet built" for the exact list.

**Security/correctness audit (see "Audit fixes" below):** a follow-up pass
fixed a stock overselling race condition, added review edit/delete, added
real (non-trusting) review photo uploads, replaced the in-memory rate
limiter with a Redis-backed one for production, closed a checkout identity
gap, and hardened idempotent order creation against concurrent duplicate
requests. All of that is described in detail in "Audit fixes" near the
bottom of this file, with exact file paths.

**Not yet built:**
- Homepage banner management UI (banners currently hardcoded in `page.tsx`)
- Bulk CSV product import (single-product form only, in `/admin/products/new`)
- Charts/analytics dashboard (raw counts only, on `/admin`)
- Real SMS provider integration (OTPs log to console in dev — see `src/lib/sms.ts`)
- Online payment gateway (interface is defined and typed in
  `src/lib/payments/provider.ts`; no gateway is wired up)
- PWA manifest/service worker

## Architecture

- **Framework**: Next.js 14 App Router, React Server Components by default;
  client components only where interactivity requires it (cart, checkout
  form, review form, admin login).
- **Database**: PostgreSQL via Prisma. Schema in `prisma/schema.prisma`.
- **Auth**: Phone + OTP, session stored as an httpOnly JWT cookie
  (`src/lib/auth.ts`). Guest checkout is fully supported — login is never
  required to place an order. Admin accounts are regular `User` rows with
  `role: ADMIN`; the admin section (`/admin/**`) is gated by
  `requireAdmin()` in `src/app/admin/layout.tsx`.
- **Payments**: `PaymentProvider` interface
  (`src/lib/payments/provider.ts`) with a COD implementation live today.
  Adding bKash/Nagad/a gateway means implementing the interface and
  registering it in `getPaymentProvider()` — no changes to order logic,
  checkout UI, or the database schema are needed.
- **Reviews**: Every review is linked to a specific `OrderItem`
  (`orderItemId`, unique) — this is what makes "verified purchase"
  structurally true rather than a display label. Eligibility
  (`src/lib/review-eligibility.ts`) is checked both in the UI (to
  show/hide the button) and in the API (`/api/reviews`) so it can't be
  bypassed. Admin moderation actions are all logged to `ReviewAuditLog`
  with a required reason for reject/hide — see `src/app/admin/reviews/actions.ts`.
- **Configurable business decisions** live in `src/lib/config.ts` with
  comments explaining what each one does and where to change it (review
  reminder timing, edit window, duplicate-submit window, fallback delivery
  charge, OTP settings).

## Folder structure

```
prisma/
  schema.prisma        # full DB schema
  seed.ts               # demo data (categories, 2 demo products, delivery
                         # zones, dev test accounts) — NO fake reviews
src/
  app/
    page.tsx             # Home
    shop/                # Catalog + product detail
    cart/, checkout/      # Cart + checkout
    order-confirmation/[orderId]/
    account/              # Login, profile, order history
    reviews/new/, reviews/[reviewId]/report/
    about/, delivery-information/, contact/, faq/,
    privacy-policy/, terms-and-conditions/
    admin/                 # Admin dashboard (see below)
    api/                   # Route handlers (cart, checkout, auth/otp,
                            # reviews, reviews/report, contact, admin/orders/export)
    sitemap.ts, robots.ts
  components/            # ProductCard, StarRating, ReviewList, BottomNav, etc.
  lib/                   # prisma client, auth, cart, pricing, stock,
                          # review-eligibility, delivery-charge, validation
                          # (zod schemas), rate-limit, payments/
tests/
  unit/                  # vitest — pricing, stock, review-eligibility, order-number
  e2e/                    # playwright — checkout, review submission
```

## Database schema

See `prisma/schema.prisma` for the authoritative, commented schema. Summary
of entities: `User`, `OtpCode`, `AdminUser`, `Address`, `Category`,
`Product`, `ProductVariant`, `Cart`/`CartItem`, `Order`/`OrderItem`,
`Payment`, `Review`, `ReviewReport`, `ReviewAuditLog`, `Notification`,
`DeliveryZone`, `SiteSetting`, `AuditLog`.

## Main user flows

1. **Browse → buy (guest)**: Home/Shop → Product detail → Add to cart →
   Cart → Checkout (name + phone + address, no account needed) → Order
   confirmation. A `User` row is created from the phone number at checkout
   if one doesn't exist, and the browser is signed in automatically so
   `/account/orders` works afterward.
2. **Buy (logged in)**: Same as above, but via OTP login first
   (`/account/login`) — address is still collected per-order for now
   (saved-address selection is a natural next extension of the `Address`
   model, not yet wired into checkout UI).
3. **Order fulfillment (admin)**: `/admin/orders` → change status through
   Pending → Confirmed → Processing → Packed → Shipped → Delivered. Moving
   to Delivered creates a `REVIEW_REQUEST` notification row and unlocks
   the review button on that order's items.
4. **Review**: `/account/orders` → "রিভিউ দিন" (only shown for delivered,
   unreviewed items) → `/reviews/new` → submitted as `PENDING` → admin
   approves/rejects in `/admin/reviews` → appears on the product page only
   once `APPROVED`.
5. **Moderation**: `/admin/reviews` shows a pending queue, an open-reports
   queue, recently approved reviews (with a "hide" action), and hidden
   reviews (with a "restore" action). Every state change writes a
   `ReviewAuditLog` row; hide/reject require a typed reason.

## Assumptions made

- Bangladeshi phone format `01XXXXXXXXX` (or `+880` prefix) is the only
  identity used for login — no email/password option.
- Guest checkout creates a lightweight account automatically; there's no
  separate "guest order, never becomes an account" path, since order
  history needs *some* identity to attach to.
- District list in checkout is a short hardcoded sample
  (`src/app/checkout/page.tsx`); replace with the full 64-district list
  before launch.
- Delivery charge is looked up by exact district+upazila match, then by
  district-only rows, then a configurable flat fallback
  (`DELIVERY_CONFIG.fallbackChargeTaka` in `src/lib/config.ts`).
- Product images are referenced by URL string (e.g. a Supabase Storage
  URL); there's no upload widget in the admin UI yet — `imageUrl` is a
  plain text field on the "new product" form.

## Review reminders — how they work

`REVIEW_CONFIG` (`src/lib/config.ts`) defines the timing: a first reminder
`firstReminderDays` (default 3) after delivery, a final one
`finalReminderDays` (default 7) after the first, then nothing further.

**What's real vs. what you must wire up:**
- The decision logic is a pure, fully unit-tested function —
  `decideReviewReminderAction` in `src/lib/review-reminders.ts`
  (`tests/unit/review-reminders.test.ts`). Given an order's delivery
  time, whether it still has unreviewed items, whether it's been
  dismissed, and which reminders already went out, it returns
  `'none' | 'send_first' | 'send_final'`.
- `POST /api/cron/review-reminders` does the actual work: finds delivered
  orders, applies the decision function to each, and creates
  `REVIEW_REMINDER` notification rows where due. It is NOT triggered by
  anything automatically — **you must point an external scheduler at
  it**, once a day is plenty (the windows are measured in days). It's
  protected by a shared secret: set `CRON_SECRET` in your environment and
  have your scheduler send `Authorization: Bearer <CRON_SECRET>`. Options:
  - Vercel Cron — add to `vercel.json`:
    ```json
    { "crons": [{ "path": "/api/cron/review-reminders", "schedule": "0 3 * * *" }] }
    ```
    (Vercel Cron requests need `CRON_SECRET` forwarded as the bearer
    token yourself — Vercel doesn't do this for you unless you configure
    it — see Vercel's Cron Jobs docs for the current mechanism.)
  - Any other host: cron-job.org, a GitHub Actions scheduled workflow, or
    a plain crontab entry running `curl -X POST -H "Authorization: Bearer
    $CRON_SECRET" https://yourdomain.com/api/cron/review-reminders`.
  - Without `CRON_SECRET` set, the route refuses every request (500) —
    it will never run unauthenticated by accident.
- `Order.deliveredAt` (added to `prisma/schema.prisma` in this pass) is
  set once, the first time an order's status becomes `DELIVERED` (see
  `src/app/admin/orders/actions.ts`) — kept separate from `updatedAt` so
  reminder timing can't be thrown off by an unrelated later edit to the
  order.
- Reminders stop the moment every item on the order has an active
  (non-deleted) review, or the customer dismisses them via
  `POST /api/notifications/review-reminder/dismiss` (`{ orderId }`,
  logged-in customer, must own the order) — neither blocks the customer
  from still submitting a review later.
- The home page (`src/app/page.tsx`) shows a dismissible
  `ReviewRequestCard` for a logged-in customer with an eligible delivered
  order — this is a passive, always-visible nudge shown regardless of the
  reminder-day timing above (per the original spec: "Show a review
  request card on the home page only for logged-in eligible customers"),
  separate from the scheduled push notifications the cron route creates.

## Audit fixes (this pass)

A follow-up correctness/security audit fixed the following. Nothing below
was a rewrite — each is a scoped change to the specific file(s) listed.

1. **Stock race condition (overselling).** The checkout transaction used
   to do `stockQty: { decrement: qty }` unconditionally, so two
   concurrent checkouts for the last unit could both "succeed" and push
   stock negative. Fixed in `src/app/api/checkout/route.ts` by switching
   to `tx.productVariant.updateMany({ where: { id, stockQty: { gte: qty
   } }, data: { stockQty: { decrement: qty } } })` and checking
   `count === 0` to detect a failed guard — Postgres evaluates that
   WHERE clause atomically against the row's current value, so two
   concurrent decrements for the same unit can't both pass. A failure
   throws `InsufficientStockError` (`src/lib/stock.ts`), which rolls back
   the whole `$transaction` (order + address + stock changes) and
   returns a 409, not a 500. Test: `tests/unit/stock.test.ts` (`decrementStockOrThrow —
   concurrency safety`) — this is a logic-level test against a mock repo
   that mirrors the guarded-UPDATE semantics; it proves the guard logic
   itself is correct, not that Postgres is (Postgres's atomicity of a
   single UPDATE statement is a property of the database, not something
   a unit test can exercise without a live instance).

2. **`.gitignore`.** Rewritten to explicitly cover `.env`, `.env.local`,
   `.env.*.local`, `node_modules`, `.next`, `coverage`,
   `playwright-report`, `test-results`, `*.log` — and explicitly does
   NOT ignore `.env.example`.

3. **Review edit/delete.** Did not exist before this pass — verified by
   inspection, then implemented in
   `src/app/api/reviews/[reviewId]/route.ts` (`PATCH`/`DELETE`). Rules
   enforced: owner-only (`403` otherwise), edit window from
   `REVIEW_CONFIG.editWindowHours` (`409` once expired), only
   `rating`/`bodyBn`/`photoUrl` can change (built via an explicit
   allow-list in the Prisma `update` call — never a spread of the
   request body, so `productId`/`orderItemId`/`userId`/`isVerified`
   cannot be touched by a customer regardless of what the request
   contains), `editedAt` is set on every edit, and an edited review is
   put back to `PENDING` so it re-enters moderation. Delete is a soft
   delete (`deletedAt` — see `prisma/schema.prisma`), which every
   public-facing query now filters on (`src/lib/queries.ts`,
   `src/components/ReviewList.tsx`, `src/app/page.tsx`,
   `src/app/admin/reviews/page.tsx`) — a deleted review is never visible
   again, while the row itself is kept so any existing
   `ReviewAuditLog` rows referencing it stay valid. Shared
   ownership/window logic lives in `canEditOwnReview`/`canDeleteOwnReview`
   (`src/lib/review-eligibility.ts`). **Design decision worth flagging:**
   because `Review.orderItemId` is `@unique`, deleting a review does not
   free up that order item for a brand-new review — the one-review-per-
   purchase rule from the original spec is treated as permanent per
   order item, not reset by deletion. If you want delete-then-resubmit
   instead, that unique constraint needs to move to a partial/conditional
   one, which is a real schema decision, not something I changed
   unilaterally.
   Tests: `tests/unit/review-ownership.test.ts` — owner-can-edit-within-
   window, owner-cannot-edit-after-window, another-user-cannot-edit,
   owner-can-delete-within-period, another-user-cannot-delete, plus
   already-deleted edge cases.

4. **Review photo upload.** Did not exist before this pass — the schema
   had `photoUrl` but the submit API just trusted whatever URL string
   the client sent (`z.string().url()`), which is exactly "arbitrary
   external URLs allowed." Implemented:
   - `src/lib/image-sniff.ts` — sniffs the real image format from file
     bytes (JPEG/PNG/WebP magic numbers), ignoring the client-supplied
     `file.type` entirely.
   - `src/lib/storage/provider.ts` — `StorageProvider` interface plus a
     real Supabase Storage implementation (`@supabase/supabase-js`,
     added to `package.json`). The service-role key is read only here,
     server-side, from `SUPABASE_SERVICE_ROLE_KEY` — never exposed to
     the browser, never `NEXT_PUBLIC_`. Also exports
     `isReviewPhotoUrlOwnedBy(url, userId)`, which checks the URL's host
     against the configured Supabase project AND that the storage path
     was written under that specific user's own upload folder.
   - `src/app/api/reviews/upload/route.ts` — new endpoint: requires a
     logged-in customer, rate-limited, enforces
     `REVIEW_CONFIG.maxPhotoSizeBytes` (5MB default, `src/lib/config.ts`),
     sniffs the MIME type from bytes, rejects anything that isn't
     JPEG/PNG/WebP, uploads via the storage provider, returns the
     resulting URL.
   - `src/app/api/reviews/route.ts` and
     `src/app/api/reviews/[reviewId]/route.ts` now both call
     `isReviewPhotoUrlOwnedBy` before persisting any `photoUrl` on
     create or edit — an arbitrary external URL, or another customer's
     uploaded photo, is rejected with a 400.
   - `src/app/reviews/new/page.tsx` — real file input wired to the
     upload endpoint instead of the previous "coming soon" placeholder
     text.
   Tests: `tests/unit/photo-upload.test.ts` — MIME sniffing (including a
   disguised non-image payload) and URL-ownership checks (own upload
   accepted, another user's upload rejected, arbitrary external host
   rejected, malformed URL rejected, unconfigured storage rejects
   everything).

5. **Rate limiter.** `src/lib/rate-limit.ts` rewritten: same exported
   `rateLimit(key, maxAttempts, windowMs)` shape, now `async`, backed by
   Upstash Redis (`@upstash/redis`, REST-based, works from
   serverless/edge) when `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` are set, falling back to the original
   in-memory `Map` when they're not (development default; note this
   fallback does NOT share state across multiple server instances). A
   Redis error at runtime degrades to the in-memory limiter for that
   request rather than throwing. Every call site
   (`checkout`, `auth/otp/request`, `auth/otp/verify`, `reviews`,
   `reviews/report`, `contact`, `reviews/upload`) was updated to
   `await rateLimit(...)`. Env vars documented in `.env.example`.
   Test: `tests/unit/rate-limit.test.ts` (in-memory backend: allow up to
   max, block over max, independent keys, window reset). The Redis
   backend itself isn't unit-testable without a real/mocked Redis
   instance — it's a thin, mostly declarative wrapper around
   `@upstash/redis`'s `incr`/`expire`/`ttl`, reviewed by inspection.

6. **Checkout identity handling.** Audited and fixed a real gap: a
   logged-in session used to be preserved correctly, but a **guest**
   checkout used `prisma.user.upsert({ where: { phone } })` — if the
   typed phone number already belonged to a registered (but
   OTP-unverified-in-this-request) account, the order (and that
   account's `name` field) would be silently attached to it. That's a
   real problem beyond "wrong attribution": since review eligibility is
   keyed off `order.userId`, it could let someone generate a
   "verified purchase" review credential on an account that isn't
   theirs. Fixed via a new pure decision function,
   `resolveCheckoutIdentity` (`src/lib/checkout-identity.ts`), used by
   `src/app/api/checkout/route.ts`:
   - Logged-in session + form phone matches session phone → use the
     session's identity.
   - Logged-in session + form phone does NOT match → **reject with a
     409** and an explicit Bengali message, instead of silently using
     either value.
   - No session + phone is unowned → create a new guest account (as
     before).
   - No session + phone already belongs to an existing account →
     **reject with a 409** (`requiresLogin: true` in the response body)
     asking them to log in, instead of silently attaching the order to
     that account.
   Test: `tests/unit/checkout-identity.test.ts`, including the exact
   scenario from the audit request (logged-in session A, mismatched form
   phone) and the guest-hijack scenario.

7. **Idempotency race.** The `findUnique` → `create` sequence in
   checkout could still race: two identical requests could both pass the
   `findUnique` check before either finished `create`, and the second
   `create` would then throw an unhandled Prisma `P2002` unique-
   constraint error (a 500) instead of returning the order the first
   request created. Fixed generically in `src/lib/idempotent-order.ts`
   (`createOrderIdempotently`), used by `src/app/api/checkout/route.ts`:
   the DB's `UNIQUE` constraint on `idempotencyKey` remains the actual
   source of truth (nothing here weakens or replaces it); a
   `P2002` on that specific constraint is caught and re-resolved into
   "look up and return the order the winning request created" instead
   of propagating as a 500. Any other error still propagates normally.
   Test: `tests/unit/idempotent-order.test.ts`, including a simulated
   concurrent-duplicate-request race (`Promise.all` of two calls sharing
   one fake store with a lock, modeling how Postgres only reports the
   conflict once the winning row is durable) that asserts both calls
   resolve to the same order.

8. **Review edit/delete UI (follow-up to #3).** The API routes were
   fully enforced but unreachable from the UI. Added:
   `GET /api/reviews/[reviewId]` (owner-only — returns 404 for anyone
   else's review, even though it exists, so this route can never be used
   to browse other customers' reviews) to prefill an edit form; a new
   `src/app/reviews/[reviewId]/edit/page.tsx` with rating/text/photo
   fields plus a delete button (confirms before calling `DELETE`); and
   `/account/orders` (`src/app/account/orders/page.tsx`) now shows
   "সম্পাদনা করুন" (edit) next to a customer's own review only while
   `canEditOwnReview` says the window is still open, and shows
   "রিভিউ মুছে ফেলা হয়েছে" instead of a stale "✓" once a review has been
   soft-deleted.

## Setup

```bash
git clone <this-repo>
cd shutki-corner
cp .env.example .env      # fill in DATABASE_URL and SESSION_SECRET at minimum
npm install                # now also installs @upstash/redis and @supabase/supabase-js
npm run prisma:generate
npm run prisma:migrate     # creates tables from prisma/schema.prisma, including
                            # Review.deletedAt and Order.deliveredAt from
                            # this project's audit/scheduler follow-up passes
npm run prisma:seed        # demo categories/products/delivery zones — NO fake reviews
npm run dev
```

Visit `http://localhost:3000`. Admin dashboard: `http://localhost:3000/admin`
— log in with the dev admin phone `01700000001` from the seed script; the
OTP will be printed in your terminal (`[DEV SMS] OTP for ...`).

Rate limiting and review-photo uploads both work in development without
any extra setup (in-memory rate limiting, and photo upload will return a
clear error until Supabase Storage is configured — see `.env.example`).
Neither is required to run the core app locally.

## Database migrations

- Development: `npm run prisma:migrate` (wraps `prisma migrate dev`) —
  creates a new migration file under `prisma/migrations/` from any schema
  changes and applies it.
- Production: `npx prisma migrate deploy` — applies existing migration
  files without generating new ones (run this in your deploy pipeline,
  never `migrate dev` against production).
- After changing `prisma/schema.prisma`, always run `npm run prisma:generate`
  so `@prisma/client` types stay in sync.

## Testing

```bash
npm run test         # unit tests (vitest) — pricing, stock (incl. concurrency),
                      # review eligibility/ownership, order numbers, checkout
                      # identity resolution, idempotent order creation (incl.
                      # a simulated concurrent-duplicate race), rate limiter,
                      # image sniffing + photo URL ownership, review-reminder
                      # scheduling decisions. No DB required.
npm run test:e2e      # playwright — checkout + review submission flows.
                       # Requires a running dev server + seeded DB
                       # (playwright.config.ts starts `npm run dev` for you).
```

The review-submission e2e spec assumes a *delivered order with an
unreviewed item* exists for the logged-in test user, and that OTP login
can be bypassed in a test environment. Neither exists in the base seed
script (seeding a fake "delivered order" would misrepresent real order
history) — before running that spec, add a small test-only data script
that: creates a test customer, places a real order through the API, and
has an admin API call move it to `DELIVERED`. This keeps the e2e test
honest about what it's actually exercising.

## Deployment

1. Provision PostgreSQL (Supabase, Neon, RDS, or self-hosted).
2. Set environment variables from `.env.example` in your host (Vercel,
   Railway, Fly.io, etc.) — at minimum `DATABASE_URL`, `SESSION_SECRET`,
   `NEXT_PUBLIC_SITE_URL`. Also set `UPSTASH_REDIS_REST_URL` +
   `UPSTASH_REDIS_REST_TOKEN` before going live — without them, rate
   limiting silently falls back to a per-process in-memory limiter that
   does not share state across multiple server instances. Set
   `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (+ optionally
   `SUPABASE_REVIEW_PHOTOS_BUCKET`) if customers should be able to attach
   photos to reviews. Set `CRON_SECRET` and point an external scheduler
   at `POST /api/cron/review-reminders` (see README > "Review reminders")
   if you want review reminders to actually go out — nothing fires them
   on its own.
3. Run `npx prisma migrate deploy` against the production database (as a
   release step / one-off job — not on every server boot).
4. Build: `npm run build`. Start: `npm run start` (or let your platform's
   Next.js integration handle this, e.g. Vercel).
5. Point your domain's DNS at the host; `NEXT_PUBLIC_SITE_URL` must match
   the final domain for `sitemap.ts`/`robots.ts`/Open Graph URLs to be
   correct.
6. Before taking real orders: replace `SMS_PROVIDER=console` with a real
   provider (implement it in `src/lib/sms.ts`), archive/delete the
   `isDemo: true` seed products, and swap the hardcoded district list in
   checkout for the full list.

## Test accounts (development only)

Created by `npm run prisma:seed`:

| Role | Phone | Notes |
|---|---|---|
| Admin | `01700000001` | OTP printed to server console |
| Customer | `01700000002` | OTP printed to server console |

These exist only when `SMS_PROVIDER=console` (the dev default) and should
never be present in a production database.
