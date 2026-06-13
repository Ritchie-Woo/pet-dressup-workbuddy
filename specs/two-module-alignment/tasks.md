# PetMini Two-Module Alignment Implementation Plan

> Requirements: `specs/two-module-alignment/requirements.md`
> Design: `specs/two-module-alignment/design.md`
> Manual test plan: `docs/测试计划-两模块收缩版.md`

## Execution Rule

Do not start implementation until this task plan is confirmed. After confirmation, execute by batch in a separate development worktree/branch so the current worktree can remain available for real testing.

Each batch should finish with:

- Matching manual tests updated in `docs/测试计划-两模块收缩版.md`.
- Matching status rows updated in `docs/两模块目标差异清单.md`.
- Any cloud function deployment or data initialization notes recorded before manual testing.

## Batch 1: Information Architecture

- [x] 1. Reduce bottom navigation to two tabs
  - Update `miniprogram/app.json` so `tabBar.list` only contains `wp/dressup/index` and `mp/map/index`.
  - Keep `my/index` in `pages` only if direct transitional access is still needed.
  - Remove or disable `preloadRule.my/index` so hidden old flow does not preload group-buy/MBTI packages.
  - Preserve login and skip-login path to Dress-up.
  - _Requirements: R1.1, R1.2, R1.3, R1.4, R1.5_
  - _Tests: IA-01, IA-02, IA-03, IA-04, IA-05_

- [x] 2. Verify two-tab flow in WeChat Developer Tools
  - Launch or refresh the mini program.
  - Confirm bottom navigation only shows `穿搭` and `地图`.
  - Switch both ways and record results in the test plan.
  - Update information architecture rows in the gap checklist.
  - _Requirements: R1_
  - _Tests: IA-01 to IA-05_

## Batch 2: Dress-up Pet Basic Editing

- [x] 3. Add selected-pet edit entry in Dress-up
  - Update `miniprogram/wp/dressup/index.wxml` to show a small edit icon near only the selected pet avatar.
  - Use an existing TDesign icon or existing project icon style, not emoji text.
  - Ensure the edit icon tap does not accidentally trigger pet selection twice.
  - _Requirements: R2.1, R2.2, R2.3, R2.8_
  - _Tests: WP-PET-01, WP-PET-02, WP-PET-03, WP-PET-08_

- [x] 4. Wire Dress-up edit navigation and refresh behavior
  - Add `goEditPet` in `miniprogram/wp/dressup/index.js`.
  - Navigate to `/common/pet/detail/index?petId=<selectedPetId>`.
  - On return to Dress-up, reload pet list and preserve the selected pet if it still exists.
  - _Requirements: R2.4, R2.6, R2.8_
  - _Tests: WP-PET-04, WP-PET-06, WP-PET-08_

- [x] 5. Verify pet detail edit correctness
  - Inspect `miniprogram/common/pet/detail/index.*` for `common-pet:detail` loading and `common-pet:update` saving.
  - Fix missing prefill fields if found.
  - If avatar editing is present, ensure new avatar files are uploaded before saving `avatarUrl`.
  - Keep photo management out of this page for first version unless required by current code structure.
  - _Requirements: R2.5, R2.6_
  - _Tests: WP-PET-05, WP-PET-06_

- [x] 6. Validate no-pet state from Dress-up
  - Confirm no-pet users see a create-pet entry and no crash.
  - Keep existing create-pet path unless it blocks the two-module flow.
  - 2026-06-12: Code path now clears stale selected pet state when `common-pet:list` returns `[]`, and the no-selected-pet empty state has a visible create-pet button. With user approval, temporarily isolated the current account's 5 `common_pet` records by setting `is_active=0`; WeChat DevTools showed only `+ / 新增`, the empty state `选择一只宠物开始`, and the `新增宠物` button with no crash. Restored all 5 records to `is_active=1` afterward and verified by querying CloudBase.
  - _Requirements: R2.7_
  - _Tests: WP-PET-07_

## Batch 3: Pet Photos and Pet-Level Visibility

- [x] 7. Extend `common-pet` data contract
  - In `cloudfunctions/common-pet/index.js`, default new pets to `photos: []`, `is_public: true`, and `like_count: 0`.
  - Return `photos`, `isPublic`, and `likeCount` from `list` and `detail`.
  - Support `photos` and `isPublic` in `update`.
  - Validate `photos.length <= 5` on create/update.
  - Treat missing fields on old pets as `[]`, `true`, and `0`.
  - 2026-06-12: Implemented and deployed `common-pet` code update. Function now defaults/normalizes `photos`, `isPublic`, and `likeCount`, supports `photos`/`isPublic` update, and rejects more than 5 photos.
  - _Requirements: R3.1, R3.2, R3.3, R3.4, R3.5, R3.6, R3.7, R3.8_
  - _Tests: CF-01, CF-02, WP-PHOTO-01 to WP-PHOTO-07, EDGE-08_

- [x] 8. Add pet photo display and upload in Dress-up
  - Add selected-pet photo area to `miniprogram/wp/dressup/index.wxml`.
  - Show current pet photos, upload affordance, and loading state.
  - Use `wx.chooseImage` and `wx.cloud.uploadFile` to upload photos.
  - Update the selected pet through `common-pet:update` after upload.
  - Block upload in UI when current photo count is already 5.
  - Keep this separate from existing `photo2Avatar`.
  - 2026-06-12: Added selected-pet photo strip, upload entry, upload loading state, and UI-side 5-photo guard in `wp/dressup`. WeChat DevTools confirmed the photo area, upload entry, public label, and `0/5` counter render; the macOS file picker opened but its `打开` button stayed disabled for local PNG/JPG test files, so actual file selection still needs a final device/user-environment confirmation.
  - 2026-06-12: User confirmed real upload succeeded and the uploaded pet photo appeared in the photo list.
  - _Requirements: R3.1, R3.2, R3.3_
  - _Tests: WP-PHOTO-01, WP-PHOTO-02, WP-PHOTO-03, WP-PHOTO-04_

- [x] 9. Add pet photo deletion in Dress-up
  - Add delete control per photo.
  - Confirm before removing a photo from the selected pet.
  - Update `photos` via `common-pet:update`.
  - Do not delete unrelated pet data.
  - Defer physical cloud storage cleanup unless storage cleanup is already straightforward in the current project.
  - 2026-06-12: Added per-photo delete control and confirmation; data removal is done by updating the selected pet's `photos` array through `common-pet:update`. Physical storage cleanup is deferred as planned.
  - 2026-06-12: User confirmed deleting the uploaded pet photo succeeded.
  - _Requirements: R3.4_
  - _Tests: WP-PHOTO-02, WP-PHOTO-04_

- [x] 10. Add pet-level public/private toggle
  - Add a visibility toggle at the selected pet photo area top-left.
  - Default missing `isPublic` to public in the UI.
  - Save toggle changes through `common-pet:update`.
  - Ensure private pets remain visible to their owner in Dress-up.
  - 2026-06-12: Added pet-level public/private toggle in the photo area. WeChat DevTools confirmed old pets without `is_public` display as public; toggling `cookie` to private wrote `is_public=false`, and toggling back restored `is_public=true`.
  - _Requirements: R3.5, R3.6, R3.7, R3.8_
  - _Tests: WP-PHOTO-05, WP-PHOTO-06, WP-PHOTO-07, EDGE-08_

- [x] 11. Deploy and verify `common-pet` changes
  - Deploy or otherwise make the updated `common-pet` cloud function available in the test environment.
  - Use Cloud Function auxiliary checks for list/update if page behavior is unclear.
  - Record deployment notes needed for manual testing.
  - 2026-06-12: Deployed `common-pet` with request `88f0064b-2216-4eaa-b81d-551dddcb0cf2`. Direct management `invokeFunction` without WeChat context is not valid for `list` because `OPENID` is undefined. Interface checks completed via deployed function and real page context: 5-photo update succeeded (`ad1e1e52-866f-43ea-95db-1dfd052b49bc`), 6-photo update returned `最多上传 5 张照片` (`8144b50b-3a15-4d96-a48a-0cfe8bef37c8`), restore update succeeded (`6c340d9c-92c2-4a4e-b3eb-405dc659e9d0`). Test data was restored: `cookie.photos=[]`, `cookie.is_public=true`; uploaded temporary Storage file `petmini-test/batch3-photo-toy_01.jpg` was deleted.
  - _Requirements: R3, NFR3_
  - _Tests: CF-01, CF-02_

## Batch 4: Public Pet Discovery and Likes

- [x] 12. Rework public discovery list source
  - Update `cloudfunctions/wp-recommend/index.js` `list` action to read active public pets from `common_pet`.
  - Treat missing `is_public` as public for compatibility.
  - Return at most 3 randomly ordered pets.
  - Return `photos`, `avatarUrl`, `likes`, and `liked`.
  - Avoid fake filler data when fewer than 3 public pets exist.
  - 2026-06-12: `wp-recommend:list` 已改为读取 `common_pet` 活跃宠物，按 `is_public !== false` 过滤，兼容旧宠物缺字段默认公开；返回最多 3 只随机宠物，并带 `photos/avatarUrl/likes/liked`。同时排除旧 `seed_pool` 假数据，不再用假数据补满。
  - 2026-06-12: 云函数接口检查通过：RequestId `32c7e321-a9cb-4972-9d28-564861ae3283` 返回 3 只真实公开宠物；临时将 3 只宠物设为不公开后，RequestId `c919a5e4-a9a4-4145-bf1d-d7860b8b2ee6` 仅返回 2 只公开宠物且无假数据，随后已恢复测试数据并用 RequestId `1bd96f69-a24c-4393-8a53-79d2fcd10dc2` 确认恢复后仍返回 3 只真实宠物。
  - _Requirements: R4.1, R4.2, R4.3, R4.4, R4.5_
  - _Tests: WP-FEED-01, WP-FEED-02, WP-FEED-03, WP-FEED-04, EDGE-05, CF-03_

- [x] 13. Add once-only like action
  - Add `like` action to `cloudfunctions/wp-recommend/index.js`.
  - Create or use `wp_pet_like` records with logical uniqueness on `user_id + pet_id`.
  - Increment `common_pet.like_count` only for the first like.
  - Return idempotent success for repeat likes without incrementing.
  - Do not implement unlike.
  - 2026-06-12: 已创建 `wp_pet_like` 集合，创建请求 `31431d26-83fb-4165-b587-6026af104671`；`like` 使用稳定 `_id = userId_petId` 实现一次性点赞语义，首次点赞写入记录并递增 `common_pet.like_count`，重复点赞返回 `alreadyLiked: true` 且不增加。
  - 2026-06-12: 云函数接口检查通过：使用管理端测试上下文 `testOpenid` 首次点赞 RequestId `97ea67d0-e255-41ea-a9e5-71da76a7f9ad` 返回 `likes:1, alreadyLiked:false`；重复点赞 RequestId `b44248c8-ac70-4db8-94d5-9c27ca94a161` 返回 `likes:1, alreadyLiked:true`。测试后已删除临时点赞记录并恢复 `cookie.like_count` 到测试前状态。
  - _Requirements: R4.6, R4.7, R4.8_
  - _Tests: WP-FEED-05, WP-FEED-06, WP-FEED-07, CF-04, CF-05_

- [x] 14. Wire discovery UI likes
  - Update `miniprogram/wp/dressup/index.*` discovery cards to show real image/photo, basic info, like count, and liked state.
  - Make the like affordance clickable without triggering unwanted card expansion.
  - Prevent repeat UI increments while the like request is in flight.
  - Preserve refresh behavior.
  - 2026-06-12: `wp/dressup` 推荐卡片已接入真实 `wp-recommend:list`，展示照片/头像、基础信息、点赞数和已点赞态；爱心点击调用 `wp-recommend:like`，带请求中保护，避免重复 UI 加数。
  - 2026-06-12: 页面手测未完成：微信开发者工具重编译后模拟器出现 appservice/launch timeout，日志显示 `routeTo appLaunch timeout`，当前只能确认静态语法与云函数接口；WP-FEED 页面用例需在模拟器恢复后补测。
  - 2026-06-13: 用户按 1~8 手测顺序确认别人家的展示数量、卡片内容、换一换、不公开过滤、首次点赞、重复点赞、点赞不可取消均通过。
  - _Requirements: R4.1, R4.3, R4.5, R4.6, R4.7, R4.8_
  - _Tests: WP-FEED-01 to WP-FEED-07_

- [x] 15. Deploy and verify `wp-recommend`
  - Deploy or make updated `wp-recommend` available in the test environment.
  - Use auxiliary cloud function checks if UI results are ambiguous.
  - Record any data setup needed to have at least 3 public pets.
  - 2026-06-12: 已部署 `wp-recommend`，最新部署请求 `15c11dd3-267a-4bbe-9c35-f6882d19f2e4`；此前部署请求包括 `05f2455b-4026-40d1-9618-6898490bcaa9`、`26163006-1201-422b-b62a-8188e467fa32`。CF-03/CF-04/CF-05 接口级检查通过。
  - 2026-06-12: Batch 4 尚未完成：微信开发者工具页面手测 WP-FEED-01 到 WP-FEED-07 因模拟器启动超时阻塞，恢复模拟器后需补测并再关闭本项。
  - 2026-06-13: 微信开发者工具服务端口恢复后，用户手动完成 WP-FEED-01 到 WP-FEED-07 对应页面检查，结果均通过；Batch 4 验证闭环，可以进入 Batch 5。
  - _Requirements: R4, NFR3_
  - _Tests: CF-03, CF-04, CF-05_

## Batch 5: Pet-Friendly Place Map Alignment

- [x] 16. Align shared place category constants
  - Update `miniprogram/utils/const.js` place category constants to `mall`, `restaurant`, `park`, `hotel`, `adoption`, `other`.
  - Use labels `商场`, `餐厅`, `公园`, `酒店`, `领养`, `其他`.
  - Check current imports so old removed constants are not still required.
  - 2026-06-13: Verified `miniprogram/utils/const.js` uses the target category values and labels. Current map/place code uses the same category set; old place categories are not required by Batch 5 flow.
  - _Requirements: R5.2, R5.3_
  - _Tests: MP-PLACE-03 to MP-PLACE-08_

- [x] 17. Add source and time to place detail API
  - Update `cloudfunctions/mp-place/index.js` `detail` action to return `source`, `createdAt`, and `updatedAt`.
  - Keep `list` output source-free.
  - Preserve existing place detail stats/checkin fields.
  - 2026-06-13: Verified deployed `mp-place:detail` returns `source`, `createdAt`, and `updatedAt`, while `mp-place:list` does not expose source. Detail still returns stats/checkin fields.
  - _Requirements: R5.4, R5.5, R5.6, R5.7, R5.8_
  - _Tests: MP-DETAIL-01, MP-DETAIL-02, MP-DETAIL-03, MP-DETAIL-04, MP-DETAIL-06, CF-07_

- [x] 18. Display source and time on place detail page
  - Update `miniprogram/mp/place/index.*`.
  - Add source label mapping for Douyin, Xiaohongshu, official account, manual confirmation, user submission, dev seed, and unknown.
  - Show recorded or updated time only when available.
  - Ensure missing optional fields do not crash or create broken layout.
  - 2026-06-13: Verified detail page maps source labels including Douyin/Xiaohongshu/official account/manual/user/dev seed/unknown, and renders source/recorded/updated rows only when data exists.
  - _Requirements: R5.5, R5.6, R5.7, R5.8_
  - _Tests: MP-DETAIL-01, MP-DETAIL-02, MP-DETAIL-03, MP-DETAIL-06_

- [x] 19. Document semi-automatic place collection plan
  - Create `docs/地图地点半自动采集方案.md`.
  - Document clue source, normalization, geocoding, manual review, approval, rejection, and update policy.
  - Do not run or create live external collection.
  - 2026-06-13: Created `docs/地图地点半自动采集方案.md`; no live external collection was executed.
  - _Requirements: R5.9_
  - _Tests: Documentation review against R5.9_

- [x] 20. Deploy and verify place changes
  - Deploy or make updated `mp-place` available in the test environment.
  - Manually test category filters and place detail display.
  - Update map/place rows in the gap checklist.
  - 2026-06-13: `mp-place` deployed with request `10267c6d-3598-42f7-83a2-682f2159a5e3`. Interface checks passed: mall `53f6a7a6-cacb-40a3-8a8f-d8bdd1b19a46`, restaurant `a8be21b3-95e6-44aa-a02b-b6191584d585`, park `71f44909-73a2-483e-9a60-45c7e03cb67a`, hotel `e1e164d8-b54d-4e0a-8f1e-4b611727d86c`, adoption `f3bb7159-7542-4aff-bf27-46a52495fd98`, other empty boundary `375dd8e3-71aa-405c-b3e6-eea291a185c3`, all-category restore `032a2b11-9bd7-4ffd-bba7-d637d7e0f748`, detail source/time `85380c23-6230-4cb9-b0a7-860b9024e761`.
  - _Requirements: R5, NFR3_
  - _Tests: MP-PLACE-01 to MP-PLACE-09, MP-DETAIL-01 to MP-DETAIL-06, CF-06, CF-07_

## Batch 6: Dog Walking Privacy and Aggregation

- [x] 21. Update dog-walking backend session rules
  - Change `cloudfunctions/mp-walk/index.js` stale threshold from 5 minutes to 15 minutes.
  - Validate `start` pet ownership.
  - Validate `start` only accepts dog pets.
  - Store precise location server-side only.
  - Ensure `stop` removes the active session even if history writing fails.
  - 2026-06-13: Implemented in `mp-walk`: stale threshold is 15 minutes, `start` validates owner and dog species, active sessions no longer store pet name, and `stop` keeps active-session removal outside the history-write failure path.
  - _Requirements: R6.3, R6.4, R6.5, R6.12_
  - _Tests: MP-WALK-03, MP-WALK-04, MP-WALK-05, EDGE-06, CF-08, CF-10_

- [x] 22. Add radius-based walking query with privacy aggregation
  - Update `mp-walk:query` to accept `latitude`, `longitude`, and `radius`, defaulting first version usage to 1000 meters.
  - Use bounding box plus Haversine distance filtering.
  - Exclude expired sessions with a 15-minute cutoff.
  - Return aggregate groups with blurred representative coordinates.
  - Return avatar-only pet objects.
  - Do not return `pet_name`, user identity, exact coordinates, exact distance, or route.
  - Preserve old viewport behavior only if still needed for historical hotspots.
  - 2026-06-13: `query` now accepts center/radius, applies bounding-box plus Haversine filtering, excludes expired sessions, filters out the current user's own active session from nearby results, and returns `groups` with snapped coordinates plus avatar-only pet entries. Added `tests/mp-walk-privacy.test.js` for helper/query privacy coverage.
  - _Requirements: R6.6, R6.7, R6.8, R6.9, R6.10, R6.11, R6.12, NFR4_
  - _Tests: MP-WALK-06, MP-WALK-07, MP-WALK-08, MP-WALK-09, MP-WALK-10, CF-09_

- [x] 23. Update map walking query wrapper
  - Update `miniprogram/utils/request.js` `queryWalkers` wrapper to support the new `{ latitude, longitude, radius }` request.
  - Keep function names stable unless a rename materially improves clarity.
  - 2026-06-13: `queryWalkers(params)` forwards `{ latitude, longitude, radius }` to `mp-walk:query` while keeping the wrapper name stable.
  - _Requirements: R6.6_
  - _Tests: CF-09, MP-WALK-06_

- [x] 24. Update map walking UI and state
  - In `miniprogram/mp/map/index.js`, query nearby walking groups with current location and `radius: 1000`.
  - Replace exact walker markers with aggregate bubble markers.
  - Add group tap handling to open a compact avatar-only panel.
  - Remove pet names from markers, callouts, and panels.
  - Ensure no exact location or distance appears in walking UI.
  - 2026-06-13: Map walking mode now calls `queryWalkers({ latitude, longitude, radius: 1000 })`, renders aggregate walk markers, and opens an avatar-only group panel without names, exact distance, or route display.
  - _Requirements: R6.6, R6.8, R6.9, R6.10, R6.11_
  - _Tests: MP-WALK-06, MP-WALK-08, MP-WALK-09, MP-WALK-10_

- [x] 25. Improve dog-walking pet selection and restart behavior
  - Ensure `walkPetList` only contains dog pets.
  - Show a clear no-dog prompt when no eligible dog exists.
  - On app/page show after restart, avoid showing a stale permanent walking state.
  - Keep manual stop behavior.
  - 2026-06-13: `walkPetList` filters to dog pets, no-dog users get a no-eligible-dog prompt, timers are cleared on hide/unload, stale local walking state is cleared after the 15-minute threshold, and manual stop remains available.
  - _Requirements: R6.1, R6.2, R6.3, R6.5, R6.13_
  - _Tests: MP-WALK-01, MP-WALK-02, MP-WALK-03, MP-WALK-05, EDGE-07_

- [x] 26. Deploy and verify dog-walking changes
  - Deploy or make updated `mp-walk` available in the test environment.
  - Test with two accounts or controlled cloud function data.
  - Use a controlled method for EDGE-06 if waiting 15 minutes is not practical, but keep production threshold at 15 minutes.
  - Update dog-walking rows in the gap checklist.
  - 2026-06-13: Deployed `mp-walk` code update with request `7dcb9472-c3c9-4f27-9bcb-04dfed91d13e`; `queryFunctions:getFunctionDetail` request `6208f11c-a6d6-438e-b140-8a5958297471` confirmed remote code has 15-minute threshold, radius query, `groups` response, and current-user filtering. Management `invokeFunction` request `d82b9264-3ce6-48f3-a9b0-17d1c782c33c` returned `openid 缺失`, so user-context start/query/stop still needs WeChat Developer Tools or real-device validation.
  - 2026-06-13: User-context validation completed in WeChat Developer Tools: dog-walking entry, dog selection, `cookie` start/stop, aggregate bubble, avatar-only panel, privacy display, restart behavior, no-dog state, and 1 km negative filtering all passed. `mp-walk-seed` was deployed with RequestId `93aacc1a-51fe-4416-baed-5f3f7eb0ebd9`; `seedXuanwu` invocation RequestId `e5bb4e91-e3c2-4c84-9df3-9ea0beca2d3d` wrote 3 test records, where the third is about 1981m away and did not appear in nearby results.
  - _Requirements: R6, NFR4_
  - _Tests: MP-WALK-01 to MP-WALK-10, EDGE-01, EDGE-06, EDGE-07, CF-08 to CF-10_

## Final Integration

- [x] 27. Run focused full regression for the two-module scope
  - Re-run all test sections in `docs/测试计划-两模块收缩版.md` that correspond to implemented batches.
  - Confirm old out-of-scope modules are not exposed as primary flow.
  - Confirm no blank page in login, Dress-up, Map, and place detail entry points.
  - _Requirements: R1 to R6, NFR1 to NFR5_
  - _Tests: Full two-module manual test plan_
  - 2026-06-13: `docs/测试计划-两模块收缩版.md` records Batch 1-6 as complete: IA 5/5, pet profile 8/8, photos/public 7/7, public feed/likes 7/7, map places 9/9, place detail 6/6, dog walking 10/10. `node tests/mp-walk-privacy.test.js` passes.

- [x] 28. Final documentation and handoff
  - Update `docs/两模块目标差异清单.md` statuses.
  - Update `docs/测试计划-两模块收缩版.md` with final test results.
  - Record any cloud function deployment, data setup, or known limitation notes.
  - Do not commit unless explicitly requested.
  - _Requirements: NFR5_
  - _Tests: Documentation review_
  - 2026-06-13: Final handoff added at `docs/Final验收交付说明-两模块对齐.md`; `docs/测试计划-两模块收缩版.md` and `docs/两模块目标差异清单.md` have been updated to reflect final Batch 1-6 closure.
