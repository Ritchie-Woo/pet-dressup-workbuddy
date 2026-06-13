# PetMini Two-Module Alignment Design

> Requirements: `specs/two-module-alignment/requirements.md`
> Current gap inventory: `docs/两模块目标差异清单.md`
> Test plan: `docs/测试计划-两模块收缩版.md`

## 1. Design Goals

This design aligns the current mini program to the two-module first version without rebuilding the project from scratch. The implementation should preserve existing working Dress-up and Map flows, hide old primary navigation, and close only the target gaps described by the requirements.

Primary goals:

- Make Dress-up and Map the only primary bottom tabs.
- Let Dress-up own pet basic information, photos, visibility, public discovery, and likes.
- Keep Map focused on existing pet-friendly places and privacy-preserving dog walking.
- Avoid deleting old modules broadly; hide or bypass them when they are outside the first-version flow.

## 2. Current Architecture Summary

Current key files:

- App routing: `miniprogram/app.json`
- Dress-up page: `miniprogram/wp/dressup/index.js`, `index.wxml`, `index.wxss`
- Pet edit pages: `miniprogram/common/pet/create/index.*`, `miniprogram/common/pet/detail/index.*`
- Pet cloud function: `cloudfunctions/common-pet/index.js`
- Public pet discovery: `cloudfunctions/wp-recommend/index.js`
- Map page: `miniprogram/mp/map/index.js`, `index.wxml`, `index.wxss`
- Place detail page: `miniprogram/mp/place/index.js`, `index.wxml`, `index.wxss`
- Place cloud function: `cloudfunctions/mp-place/index.js`
- Dog-walking cloud function: `cloudfunctions/mp-walk/index.js`
- Shared request wrappers: `miniprogram/utils/request.js`
- Shared constants: `miniprogram/utils/const.js`

Current important constraints:

- `app.json` still exposes `my/index` as a tab and preloads old group-buy/MBTI packages through `preloadRule.my/index`.
- `common-pet` currently supports `create/list/detail/update/delete`, but not `photos`, `is_public`, or `like_count`.
- `wp-recommend` currently reads from `wp_recommend_pet`, not from public `common_pet`, and has no `like` action.
- `mp-place:detail` returns `source`, but not normalized `createdAt` or `updatedAt`.
- `mp-walk:query` currently returns exact walker coordinates and `pet_name`; this conflicts with the privacy requirements.

## 3. UI Design Specification

This is a design specification for later mini program implementation, not an immediate WXML/WXSS change.

- Purpose Statement: The first version should feel like a focused pet companion app with two work surfaces: pet presentation and pet-friendly navigation. The UI should reduce unfinished paths while keeping repeated daily actions fast.
- Aesthetic Direction: Playful/toy-like with restrained utility on Map.
- Color Palette:
  - Brand coral: `#FF5A5F`
  - Warm background: `#FFF8F0`
  - Teal action: `#0FA7A0`
  - Ink text: `#222222`
  - Soft surface: `#FFFFFF`
- Typography: Keep the existing WeChat Mini Program typography stack for compatibility and visual consistency with current pages. This intentionally overrides the generic UI-design font prohibition because the project already uses native mini program text rendering and existing page styles.
- Layout Strategy: Preserve current three-part Dress-up structure and Map full-screen layout. Add small contextual controls near the relevant object: edit icon near selected pet avatar, visibility button in the photo area, dog-walking panel over the map, and compact aggregate panel for nearby walking avatars.
- Icon Strategy: Prefer existing TDesign icons where available. Avoid adding new asset-heavy tab icons unless necessary.

## 4. Information Architecture Design

### 4.1 App Routing

`miniprogram/app.json` should be changed narrowly:

- Keep only these bottom tabs:
  - `wp/dressup/index` with text `穿搭`
  - `mp/map/index` with text `地图`
- Remove `my/index` from `tabBar.list`.
- Keep `my/index` in `pages` only if existing internal links still need it during transition.
- Remove or disable `preloadRule.my/index` so hidden old entry does not preload group-buy/MBTI packages.

No broad deletion of old pages or subpackages is required for this alignment batch.

### 4.2 Navigation Ownership

- Pet creation remains available from Dress-up through the existing add chip.
- Pet basic editing moves to Dress-up through the selected pet avatar edit icon.
- Old My page no longer acts as a primary navigation surface.

## 5. Data Model Design

### 5.1 `common_pet`

Extend existing pet documents with these fields:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `photos` | `string[]` | `[]` | Cloud file IDs or stable image URLs for pet photos |
| `is_public` | `boolean` | `true` | Pet-level public/private visibility |
| `like_count` | `number` | `0` | Cached public like count for discovery |
| `updated_at` | `Date` | current date | Already exists; update when photos/visibility/basic info changes |

Compatibility rule:

- Existing pets with no `photos` should behave as `photos: []`.
- Existing pets with no `is_public` should behave as public until explicitly changed.
- Existing pets with no `like_count` should display `0` or fall back to existing recommendation data during migration if needed.

### 5.2 `wp_pet_like`

Add a collection to record one-way likes:

| Field | Type | Purpose |
|-------|------|---------|
| `user_id` | `string` | Liking user |
| `pet_id` | `string` | Liked pet |
| `created_at` | `Date` | First like time |

Logical uniqueness:

- `user_id + pet_id` must be treated as unique in cloud function logic.
- If database index tooling is available, add a compound unique index. If not, implement a read-before-write guard and use idempotent response behavior.

### 5.3 `mp_place`

Keep the current place schema. Normalize API output only:

- `source`
- `createdAt` from `created_at`
- `updatedAt` from `updated_at`

The detail page should handle missing values gracefully.

### 5.4 `mp_active_walk`

Keep active walk storage server-side, but avoid returning precise fields to clients.

Stored fields may include:

- `user_id`
- `openid`
- `pet_id`
- `pet_avatar_url`
- `latitude`
- `longitude`
- `started_at`
- `last_heartbeat`
- `expires_at`
- `status`

Client-visible query results must not include:

- `openid`
- `user_id`
- `pet_name`
- exact `latitude`
- exact `longitude`
- exact distance
- route data

## 6. Cloud Function API Design

### 6.1 `common-pet`

Existing actions remain. Extend only the affected contracts.

#### `create`

Input additions:

- `photos?: string[]`
- `isPublic?: boolean`

Behavior:

- Default `photos` to `[]`.
- Default `is_public` to `true`.
- Reject `photos.length > 5`.

Output remains:

```json
{ "code": 1, "data": { "petId": "..." } }
```

#### `list` and `detail`

Return additions:

```json
{
  "photos": [],
  "isPublic": true,
  "likeCount": 0
}
```

#### `update`

Input additions:

- `photos?: string[]`
- `isPublic?: boolean`

Behavior:

- Validate owner.
- Reject `photos.length > 5`.
- Update `photos`, `is_public`, and `updated_at` when supplied.
- Preserve existing basic field update behavior.

### 6.2 `wp-recommend`

Keep `seed` for development if needed, but the production discovery list should no longer depend on `wp_recommend_pet`.

#### `list`

Input:

```json
{ "action": "list", "limit": 3 }
```

Behavior:

- Resolve current user from `OPENID` and `common_user` when available.
- Query active public pets from `common_pet`.
- Treat missing `is_public` as public for compatibility.
- Return at most 3 randomly ordered pets.
- Do not include private pets.
- Return `liked` for the current user when user context exists.

Output shape:

```json
{
  "code": 1,
  "data": {
    "pets": [
      {
        "petId": "...",
        "name": "...",
        "species": "dog",
        "breed": "...",
        "gender": "...",
        "birthday": "...",
        "avatarUrl": "...",
        "photos": [],
        "likes": 0,
        "liked": false
      }
    ]
  }
}
```

#### `like`

Input:

```json
{ "action": "like", "petId": "..." }
```

Behavior:

- Require a registered current user.
- Reject missing or inactive pet.
- Reject or no-op private pets.
- If the user has not liked the pet, create `wp_pet_like` and increment `common_pet.like_count`.
- If the user already liked the pet, return success without incrementing.
- Never cancel likes.

Output shape:

```json
{
  "code": 1,
  "data": {
    "liked": true,
    "likes": 1,
    "alreadyLiked": false
  }
}
```

### 6.3 `mp-place`

#### `list`

Keep current map/list behavior:

- Use existing approved data.
- Keep source hidden from list output.
- Keep category values: `mall`, `restaurant`, `park`, `hotel`, `adoption`, `other`.

#### `detail`

Return additions:

```json
{
  "source": "dev_seed",
  "createdAt": "...",
  "updatedAt": "..."
}
```

`source` display mapping should be handled in the page layer:

| Source | Display |
|--------|---------|
| `douyin` | 抖音 |
| `xiaohongshu` | 小红书 |
| `official_account` | 公众号 |
| `manual` | 人工确认 |
| `user_submitted` | 用户投稿 |
| `dev_seed` | 开发种子 |
| unknown/empty | 未标注 |

### 6.4 `mp-walk`

#### `start`

Input:

```json
{ "action": "start", "petId": "..." }
```

Behavior:

- Require registered user.
- Verify the selected pet belongs to current user.
- Verify the selected pet has `species === "dog"`.
- Store pet avatar only; do not need to store or return pet name for public display.
- Clear old active sessions for the current user as current code already does.

#### `heartbeat`

Input:

```json
{
  "action": "heartbeat",
  "sessionId": "...",
  "latitude": 32.06,
  "longitude": 118.79
}
```

Behavior:

- Require owner session.
- Reject updates after 15 minutes of no heartbeat.
- Update precise coordinates server-side only.

#### `query`

Input:

```json
{
  "action": "query",
  "latitude": 32.06,
  "longitude": 118.79,
  "radius": 1000
}
```

Compatibility:

- The old viewport query can be kept temporarily for hotspots, but the new nearby walking flow should call the radius API.

Behavior:

- Use a 15-minute active cutoff.
- Query active sessions within a bounding box first, then apply Haversine distance <= radius.
- Exclude expired sessions.
- Exclude exact identity and exact coordinate fields from the response.
- Group nearby walkers into aggregate buckets before returning.

Output shape:

```json
{
  "code": 1,
  "data": {
    "groups": [
      {
        "groupId": "walk_32.060_118.790",
        "count": 3,
        "latitude": 32.060,
        "longitude": 118.790,
        "avatars": ["cloud://..."],
        "pets": [
          { "avatarUrl": "cloud://..." }
        ]
      }
    ],
    "hotspots": []
  }
}
```

Privacy note:

- Group `latitude` and `longitude` are snapped/blurred representative coordinates for map display, not exact user positions.
- `pets` contains avatar-only objects.

#### `stop`

Keep current behavior with history write and session removal, but ensure active state is removed even if history write fails.

## 7. Frontend Page Design

### 7.1 Dress-up Page

Data additions:

- `selectedPet`
- `selectedPetPhotos`
- `selectedPetIsPublic`
- `photoUploading`
- `likingPetIds`

Interaction changes:

- In the pet chip, show a small edit icon only when `item.petId === selectedPetId`.
- Use TDesign `edit` icon or the existing icon component rather than emoji text.
- `goEditPet` navigates to `/common/pet/detail/index?petId=${selectedPetId}`.
- `onShow` reloads pets and preserves `selectedPetId` if the pet still exists.
- The current avatar-generation photo action remains separate from pet photo management.

Photo area:

- Show up to 5 pet photos for the selected pet.
- Provide upload button while count < 5.
- Provide delete affordance per photo.
- Show visibility toggle at the photo area top-left.
- Do not display per-photo visibility controls.

Discovery area:

- Replace static like text with a tap target.
- Use returned `liked` state to disable repeat increments.
- Use `photos[0] || avatarUrl` for pet image display.
- Keep "换一换" as the random refresh entry.

### 7.2 Pet Detail Page

Responsibilities:

- Continue editing basic information.
- Correctly load existing data using `common-pet:detail`.
- Save basic fields through `common-pet:update`.
- If avatar editing is supported in the page, upload new avatar to cloud storage before saving `avatarUrl`.

This page should not become the primary photo-management page unless later explicitly requested; first-version photo controls live in Dress-up.

### 7.3 Map Page

Place browsing:

- Keep the full-screen map and bottom place list pattern.
- Keep map marker/list source hidden.
- Align local category constants with the five target categories plus `other`.

Dog walking:

- Keep the existing right-side floating walk button.
- Pet selection panel lists dog pets only.
- If there are no dog pets, show a clear prompt rather than an empty confusing row.
- Starting walking hides or deemphasizes POI markers only while walking mode is active.
- Query nearby groups with `{ latitude, longitude, radius: 1000 }`.
- Render group markers with aggregate count text, e.g. `附近 3 人遛狗`.
- On group tap, open a compact overlay panel containing avatar-only rows/grid.
- Do not render exact walker markers or callouts with pet names.

### 7.4 Place Detail Page

Add a small source/time block below the main place facts:

- Source type display
- Recorded time or updated time

Missing values:

- Hide missing time rows.
- Show `未标注` for unknown source only if the source area is otherwise displayed.

## 8. Shared Constants

Update `miniprogram/utils/const.js` place categories to match the Map target:

```js
const PLACE_CATEGORY = {
  MALL: 'mall',
  RESTAURANT: 'restaurant',
  PARK: 'park',
  HOTEL: 'hotel',
  ADOPTION: 'adoption',
  OTHER: 'other'
};
```

Labels:

```js
{
  mall: '商场',
  restaurant: '餐厅',
  park: '公园',
  hotel: '酒店',
  adoption: '领养',
  other: '其他'
}
```

## 9. Semi-Automatic Place Collection Plan

Add or update documentation only. No external collection is part of this implementation.

Recommended document location:

- `docs/地图地点半自动采集方案.md`

Minimum content:

- Data sources: Douyin, Xiaohongshu, official accounts, user submissions, manual seed data.
- Input state: raw clue, source URL or source note, source type, candidate name/address/category.
- Review flow: collect clue -> normalize fields -> geocode -> manual review -> approved write to `mp_place`.
- Rejection reasons: duplicate, unclear address, no pet-friendly evidence, outdated information.
- Update policy: record `created_at`, `updated_at`, and source type.

## 10. Batch Plan

### Batch 1: Information Architecture

Files:

- `miniprogram/app.json`

Changes:

- Remove `my/index` from tabBar.
- Remove or disable old preload rule.

Validation:

- IA-01 to IA-05.

### Batch 2: Dress-up Pet Basic Editing

Files:

- `miniprogram/wp/dressup/index.*`
- `miniprogram/common/pet/detail/index.*`

Changes:

- Add selected pet edit icon and navigation.
- Refresh selected pet after edit.
- Verify avatar save path.

Validation:

- WP-PET-01 to WP-PET-08.

### Batch 3: Pet Photos and Visibility

Files:

- `cloudfunctions/common-pet/index.js`
- `miniprogram/wp/dressup/index.*`
- `miniprogram/utils/request.js` if wrapper additions are useful.

Changes:

- Add `photos`, `is_public`, and `like_count` support.
- Add photo upload/delete UI.
- Add pet-level visibility toggle.

Validation:

- WP-PHOTO-01 to WP-PHOTO-07.
- EDGE-08.

### Batch 4: Public Discovery and Likes

Files:

- `cloudfunctions/wp-recommend/index.js`
- `cloudfunctions/common-pet/index.js`
- `miniprogram/wp/dressup/index.*`

Changes:

- Public-only random list.
- Like action with once-only behavior.
- Discovery card liked state.

Validation:

- WP-FEED-01 to WP-FEED-07.
- EDGE-05.

### Batch 5: Place Map Alignment

Files:

- `miniprogram/utils/const.js`
- `cloudfunctions/mp-place/index.js`
- `miniprogram/mp/place/index.*`
- `docs/地图地点半自动采集方案.md`

Changes:

- Align category constants.
- Return and display source/time on detail page.
- Document collection plan only.

Validation:

- MP-PLACE-01 to MP-PLACE-09.
- MP-DETAIL-01 to MP-DETAIL-06.

### Batch 6: Dog Walking Privacy and Aggregation

Files:

- `cloudfunctions/mp-walk/index.js`
- `miniprogram/mp/map/index.*`
- `miniprogram/utils/request.js`

Changes:

- Dog-only server validation.
- 15-minute stale threshold.
- Radius query with aggregation response.
- Avatar-only aggregate panel.
- Remove exact walker marker rendering.

Validation:

- MP-WALK-01 to MP-WALK-10.
- EDGE-01, EDGE-06, EDGE-07.

## 11. Test Strategy

Primary validation is manual mini program testing using `docs/测试计划-两模块收缩版.md`.

For each batch:

1. Run or manually execute only the matching test section.
2. Record results in the test plan.
3. Update matching status rows in `docs/两模块目标差异清单.md`.
4. If cloud functions changed, note deployment requirements before testing.

Cloud function auxiliary checks:

- `common-pet:list/detail/update`
- `wp-recommend:list/like`
- `mp-place:list/detail`
- `mp-walk:start/heartbeat/query/stop`

## 12. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Existing pets lack new fields | Treat missing `is_public` as public, missing `photos` as empty, missing `like_count` as zero |
| Duplicate likes under race conditions | Prefer unique compound index; otherwise make `like` idempotent and recheck before increment |
| Cloud storage delete uncertainty for pet photos | First version may remove file IDs from pet record; physical storage cleanup can be deferred unless tooling is ready |
| Map walking privacy regression | Do not return exact walker coordinates or names from `mp-walk:query` |
| Old modules still reachable by direct path | Scope is primary navigation hiding; direct internal reachability can remain unless it breaks tests |
| Testing 15-minute timeout is slow | Use controlled cloud function data or temporary test-only timing during manual verification, but production constant remains 15 minutes |

## 13. Open Implementation Notes

- This design assumes CloudBase document database collections can accept new fields without explicit migration.
- If a database initialization script exists later, it should add optional index guidance for `wp_pet_like`.
- If WeChat Developer Tools cannot automate the timeout test, record EDGE-06 with cloud function console evidence.
