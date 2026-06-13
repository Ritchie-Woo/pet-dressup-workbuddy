# PetMini Two-Module Alignment Acceptance Plan

> Requirements: `specs/two-module-alignment/requirements.md`
> Design: `specs/two-module-alignment/design.md`
> Tasks: `specs/two-module-alignment/tasks.md`
> Manual test plan: `docs/测试计划-两模块收缩版.md`

## 1. Purpose

This document closes the development-to-acceptance loop for the two-module alignment work. It defines test data, CloudBase readiness checks, final acceptance gates, and the split between agent-preparable work and user-owned final judgment.

## 2. Confirmed Acceptance Assumptions

- There is currently no second real test account. Multi-person dog-walking scenarios may be validated with simulated generated data.
- Existing pet-friendly place data is available. Additional test data may be added when needed.
- CloudBase operations are allowed except deleting database collections/tables or deleting cloud functions.
- The agent may write standards and perform implementation/testing support. The user owns final detail acceptance after all development is complete.
- No commit is required unless the user explicitly asks for one.

## 3. Test Data Preparation

### 3.1 Minimum Required Data

| Area | Minimum Data | Owner | Notes |
|------|--------------|-------|-------|
| User account | 1 main test account | User | Used for normal Dress-up and Map manual testing |
| Second walking user | Simulated generated active-walk data | Agent | Replaces second real account for first acceptance pass |
| User pets | At least 3 pets | Agent can supplement if environment permits | Should include at least 1 dog |
| Dog-walking pet | At least 1 dog pet owned by main user | Agent can supplement if environment permits | Required for start-walk flow |
| Public pets | At least 3 public active pets | Agent can supplement | Required for 3-card discovery |
| Private pet | At least 1 private active pet | Agent can supplement | Required for public filtering and EDGE-08 |
| Pet photos | At least 1 pet with photos; 1 test path reaching 5 photos | Agent can supplement | Required for photo display and max-count validation |
| Places | Existing approved place data | Existing data | Should include target categories where possible |
| Place detail metadata | At least 1 place with `source`, `created_at`, `updated_at` | Agent can supplement | Required for detail source/time tests |

### 3.2 Test Data Rules

- Test data must not require external scraping or live collection.
- Test data should be added only to the current test/development environment, not production.
- If adding records, use clear seed/source markers such as `test_seed` or `dev_seed`.
- Do not delete existing user data or existing place data.
- Do not delete collections/tables to reset state.
- If physical cloud storage cleanup is uncertain, remove file references from records first and defer actual file deletion.

### 3.3 Simulated Dog-Walking Data

Because there is no second real account, dog-walking nearby tests may use simulated active-walk records.

Simulation requirements:

- Create one or more active records in `mp_active_walk` with `status: active`.
- Use `last_heartbeat` within 15 minutes.
- Use `expires_at` in the future.
- Use coordinates within 1 km of the main test location for positive tests.
- Use coordinates more than 1 km away for negative tests.
- Include only avatar data needed by the UI.
- Do not rely on pet/user names for acceptance, because public walking UI must not show names.

Acceptance mapping:

- Within-range simulated records support MP-WALK-06, MP-WALK-08, MP-WALK-09, MP-WALK-10.
- Out-of-range simulated records support MP-WALK-07.
- Expired simulated records support EDGE-06 when waiting 15 minutes is impractical.

## 4. CloudBase Readiness Checklist

### 4.1 Allowed Operations

The agent may perform or prepare:

- Cloud function code updates.
- Cloud function deployment, if the environment is authenticated and deployment is needed.
- Database record creation or updates for test data.
- Database collection creation when needed, such as `wp_pet_like`.
- Database index creation when needed and supported, such as a logical/compound uniqueness guard for likes.
- Read-only checks against collections and cloud function responses.

The agent must not perform:

- Database collection/table deletion.
- Cloud function deletion.
- Broad destructive cleanup.
- External scraping from Douyin, Xiaohongshu, or official accounts.

### 4.2 Cloud Functions To Deploy Or Verify

| Cloud Function | Required For | Acceptance Evidence |
|----------------|--------------|---------------------|
| `common-pet` | Pet fields, photos, visibility | `list/detail/update` return and persist `photos`, `isPublic`, `likeCount` |
| `wp-recommend` | Public discovery and likes | `list` returns public pets only; `like` is once-only |
| `mp-place` | Place detail source/time | `detail` returns `source`, `createdAt`, `updatedAt` |
| `mp-walk` | Dog walking privacy and aggregation | `start/heartbeat/query/stop` follow dog-only, 1 km, avatar-only, 15-minute rules |

### 4.3 Database Collections And Fields

| Collection | Required Readiness |
|------------|--------------------|
| `common_pet` | Existing docs tolerate missing `photos`, `is_public`, `like_count`; new/updated docs can store them |
| `wp_pet_like` | Exists or can be created; supports one record per `user_id + pet_id` by index or cloud function guard |
| `mp_place` | Existing approved records available; detail records may expose `source`, `created_at`, `updated_at` |
| `mp_active_walk` | Can store active walking session test records; no deletion of collection required |
| `common_user` | Main test account can resolve to user ID through current `openid` |

### 4.4 Deployment Notes To Record

For each changed cloud function, record:

- Function name.
- Deployment method used.
- Deployment time.
- Whether deployment succeeded.
- Any manual console action required.
- Any seed/test data added.

These notes can be placed in the final handoff or the relevant rows of `docs/测试计划-两模块收缩版.md`.

## 5. Final Acceptance Gates

The work is not accepted until all applicable gates are satisfied.

### Gate A: Scope Gate

Required:

- Bottom tabs show only `穿搭` and `地图`.
- `我的` is not exposed as a primary tab.
- Group-buy, MBTI, payment, order, and old full profile flows are not restored as primary flows.

Blocking failures:

- Third tab still visible.
- Cold start or skip-login reaches a blank page.
- Hidden old module appears as required first-version flow.

### Gate B: Dress-up Gate

Required:

- Pet list displays and selection works.
- Only selected pet shows the edit icon.
- Edit opens and saves the selected pet.
- Pet photos display, upload, delete, and enforce max 5.
- Pet-level visibility defaults to public and can be toggled.
- Private pets remain visible to owner but do not appear in public discovery.
- Public discovery shows up to 3 public pets.
- Likes are once-only and cannot be canceled.

Blocking failures:

- Editing the wrong pet.
- Uploading more than 5 photos.
- Private pets appearing in public discovery.
- Repeated likes increasing count.

### Gate C: Map Place Gate

Required:

- Map loads and displays existing approved pet-friendly places.
- Categories work for `商场`, `餐厅`, `公园`, `酒店`, `领养`.
- Map marker/list stays source-free.
- Detail page shows source type and recorded/updated time when available.
- Missing optional fields do not crash the detail page.
- Semi-automatic collection plan is documented only; no live collection is performed.

Blocking failures:

- Category filters are inconsistent with target categories.
- Source is exposed on marker/list.
- Detail page crashes when fields are missing.
- Any external scraping is run as part of this work.

### Gate D: Dog-Walking Privacy Gate

Required:

- Floating dog-walking entry remains on Map.
- Start flow requires selecting a dog.
- Non-dog pets cannot start dog walking.
- Manual stop works.
- Nearby query uses 1 km radius.
- Nearby results render as aggregate bubble/marker, not exact person markers.
- Aggregate detail shows pet avatars only.
- UI and query response do not expose user nickname, pet nickname, exact coordinate, exact distance, or route.
- 15 minutes without heartbeat ends active status.
- Restart does not leave the user permanently online.

Blocking failures:

- Exact walker coordinates or names are visible to the client/UI.
- Users outside 1 km appear as nearby.
- Expired sessions remain active.
- Cat/other pet can start dog walking.

### Gate E: Stability Gate

Required:

- No blank page in login, Dress-up, Map, or place detail.
- Cloud function failures show understandable toast/loading/empty state where relevant.
- Weak/missing data does not crash main pages.
- Existing working Dress-up and Map behavior is preserved unless explicitly changed by this spec.

Blocking failures:

- Main page blank screen.
- Runtime error blocks entry to Dress-up or Map.
- Cloud function failure leaves the user stuck without feedback.

## 6. Test Execution Standard

### 6.1 Required Manual Test Sections

All implemented sections in `docs/测试计划-两模块收缩版.md` should be executed before final acceptance:

- Section 4: IA-01 to IA-05
- Section 5: WP-PET-01 to WP-PET-08
- Section 6: WP-PHOTO-01 to WP-PHOTO-07
- Section 7: WP-FEED-01 to WP-FEED-07
- Section 8: MP-PLACE-01 to MP-PLACE-09
- Section 9: MP-DETAIL-01 to MP-DETAIL-06
- Section 10: MP-WALK-01 to MP-WALK-10
- Section 11: EDGE-01 to EDGE-08 where applicable

### 6.2 Result Rules

- `通过`: The UI or cloud function evidence matches the expected result.
- `不通过`: The feature is implemented but behavior contradicts expected result.
- `阻塞`: The test cannot be executed because environment, deployment, permission, or test data is unavailable.
- `暂不测`: Only allowed for explicitly out-of-scope or deferred checks. It should not hide a required first-version feature.

### 6.3 Cloud Function Auxiliary Checks

Cloud function checks are supporting evidence, not a replacement for user-visible manual tests unless UI execution is not possible.

Use auxiliary checks for:

- Debugging page failures.
- Proving once-only likes.
- Proving private pets are excluded.
- Proving walking query hides sensitive fields.
- Proving 15-minute timeout with controlled data.

## 7. User-Owned Final Review

The user will make final judgment on detail acceptance after all development is complete, especially:

- Edit icon position and tap ergonomics.
- Pet photo area layout.
- Public/private control placement.
- Discovery card visual quality.
- Place detail source/time presentation.
- Walking aggregate bubble prominence.
- Avatar-only walking panel clarity.

The agent may recommend standards and fix issues, but final UX acceptance belongs to the user.

## 8. Ready-To-Start Criteria

Development can start when:

- `requirements.md`, `design.md`, `tasks.md`, and this `acceptance.md` are accepted.
- A separate worktree/branch is created for development.
- CloudBase environment access is confirmed.
- The first batch is selected, starting with Batch 1 unless the user explicitly changes order.

Final acceptance can start when:

- All 6 batches are implemented.
- Changed cloud functions are deployed or otherwise available in the test environment.
- Required test data exists or simulated records are prepared.
- The test plan has results and notes filled for all required sections.
