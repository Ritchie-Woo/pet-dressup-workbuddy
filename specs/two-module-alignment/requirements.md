# PetMini Two-Module Alignment Requirements

> Source: `docs/两模块目标差异清单.md`, `docs/测试计划-两模块收缩版.md`, and confirmed product decisions on 2026-06-12.
> Scope: align the mini program to the first version of the two main modules: Dress-up and Map.

## 1. Problem Statement

The current project is between an older multi-module structure and the newer narrowed product direction. The next development branch shall align the app around two main modules:

- Dress-up: manage the user's pets, pet photos, visibility, public pet discovery, and likes.
- Map: browse existing pet-friendly places and use the privacy-preserving dog-walking feature.

This work shall not revive old commerce, MBTI, payment, order, or full profile-center flows.

## 2. Scope

### In Scope

- Bottom navigation reduction to Dress-up and Map.
- Moving pet basic-info editing into the Dress-up flow.
- Pet photos with upload/delete and a maximum of 5 photos per pet.
- Pet-level public/private visibility, defaulting to public.
- Public pet discovery with 3 random public pets and one-way likes.
- Existing pet-friendly place browsing by the fixed categories: mall, restaurant, park, hotel, adoption.
- Place details with source type and recorded/updated time.
- Documented semi-automatic place collection plan, without executing external collection.
- Dog-walking entry, dog-only pet selection, 1 km nearby query, privacy-preserving aggregation, avatar-only details, manual stop, and 15-minute stale timeout.

### Out of Scope

- Group buying, orders, payments, product management, and logistics.
- MBTI testing, tag-based social features, comments, follows, private messages, and pet homepages.
- Automatic scraping or live collection from Douyin, Xiaohongshu, or official accounts.
- Production launch compliance, stress testing, App Store review, or mini program submission review.
- Rebuilding the full "My" module as a primary navigation area.

## 3. Confirmed Product Decisions

- Dog walking only supports pets whose species is dog in the first version.
- Pet photos support upload and delete, with at most 5 photos per pet.
- Visibility is controlled at pet level, not per photo.
- Dog-walking aggregation details only show pet avatars; pet nicknames, user nicknames, exact positions, distances, and routes are not shown.
- The semi-automatic place collection plan is documentation-only for now; no external collection operation or script execution is part of this work.

## 4. User Stories

### 4.1 Information Architecture

As a user, I want the app to present only Dress-up and Map as primary tabs so that the first version feels focused and does not expose unfinished modules.

### 4.2 Pet Basic Information

As a pet owner, I want to select a pet in Dress-up and edit that pet's basic information from the selected pet avatar so that I do not need to enter the hidden My module.

### 4.3 Pet Photos and Visibility

As a pet owner, I want to manage up to 5 photos for each pet and decide whether the pet is public so that I can control what appears in public discovery.

### 4.4 Public Pet Discovery and Likes

As a user, I want to see a small random set of public pets and like a pet once so that the discovery area stays lightweight without adding comments, follows, or chat.

### 4.5 Pet-Friendly Places

As a map user, I want to browse existing pet-friendly places by clear categories and view source/timing details on the detail page so that I can judge whether the place information is useful.

### 4.6 Dog Walking

As a dog owner, I want to start a dog-walking status from the map and see whether nearby people are also walking dogs, while my exact location and identity remain hidden.

## 5. Functional Requirements

### R1. Information Architecture

- R1.1 When the mini program starts, the system shall expose only Dress-up and Map in the bottom tab bar.
- R1.2 When the user switches between bottom tabs, the system shall navigate between Dress-up and Map with correct highlighted tab state.
- R1.3 When the old My page remains in the codebase, the system shall not expose it as a primary bottom tab.
- R1.4 When the user enters through login or "skip for now", the system shall navigate to Dress-up or the configured login-to-Dress-up flow without showing a blank page.
- R1.5 When hidden old pages remain in the project, the system shall avoid preloading unrelated old package flows as part of the two-tab main flow.

### R2. Dress-up Pet Basic Information

- R2.1 When the user enters Dress-up with existing pets, the system shall display the user's pet avatars and names in the top pet list.
- R2.2 When the user selects a pet, the system shall make that pet the current pet and update the Dress-up content for that pet.
- R2.3 While a pet is selected, the system shall show a small edit icon near only the selected pet avatar.
- R2.4 When the user taps the selected pet's edit icon, the system shall open the basic-information edit page for that selected pet.
- R2.5 When the edit page opens, the system shall prefill the pet's existing name, species, breed, gender, birthday, and avatar if available.
- R2.6 When the user saves edited pet basic information, the system shall persist the changes and refresh the Dress-up pet list after returning.
- R2.7 When the user has no pets, the system shall show a create-pet entry in Dress-up and shall not crash.
- R2.8 When the user switches pets and then taps edit, the system shall edit the currently selected pet, not a previously selected pet.

### R3. Pet Photos and Pet-Level Visibility

- R3.1 When a pet has photos, the system shall display that pet's photo area in Dress-up.
- R3.2 When the user uploads a photo for a pet with fewer than 5 photos, the system shall add the uploaded photo to that pet's photo list.
- R3.3 When a pet has 5 photos, the system shall block additional photo uploads and tell the user that the maximum is 5 photos.
- R3.4 When the user deletes a pet photo, the system shall remove that photo from the pet's photo list without deleting unrelated pet data.
- R3.5 When a pet is created, the system shall default the pet visibility to public.
- R3.6 When the user changes a pet to private, the system shall keep the pet visible to its owner and remove it from public discovery.
- R3.7 When the user changes a private pet back to public, the system shall allow that pet to appear in public discovery again.
- R3.8 When pet visibility is evaluated, the system shall treat visibility as pet-level state rather than per-photo state.

### R4. Public Pet Discovery and Likes

- R4.1 When the Dress-up discovery area loads, the system shall show at most 3 public pets.
- R4.2 When fewer than 3 public pets are available, the system shall show the available count without generating fake pets.
- R4.3 When the user taps refresh, the system shall request another random set of public pets.
- R4.4 When a pet is private, the system shall not include it in the public discovery result.
- R4.5 When a public pet card is shown, the system shall display pet photo/avatar, basic information, and like count.
- R4.6 When the current user likes a public pet for the first time, the system shall increment the like count once and show the liked state.
- R4.7 When the current user taps like again on the same pet, the system shall not increment the like count again.
- R4.8 When a pet has already been liked by the current user, the system shall keep the liked state and shall not provide a cancel-like behavior.

### R5. Pet-Friendly Place Map

- R5.1 When the user enters Map, the system shall load the map component and show existing pet-friendly place data when available.
- R5.2 When the user selects category mall, restaurant, park, hotel, or adoption, the system shall filter places by that category.
- R5.3 When the user returns to all categories, the system shall restore all available place markers.
- R5.4 When the map displays markers or map-list entries, the system shall not show source information there.
- R5.5 When the user opens a place detail page, the system shall show the place name, category, address, and pet-friendly description when available.
- R5.6 When place source data exists, the detail page shall show the source type, such as Douyin, Xiaohongshu, official account, manual confirmation, user submission, or seed data.
- R5.7 When recorded or updated time exists, the detail page shall show a readable recorded time or updated time.
- R5.8 When optional place fields are missing, the detail page shall hide or show a reasonable empty state for those fields without crashing.
- R5.9 When semi-automatic collection is documented, the documentation shall describe external clues entering manual review before approved data is written to the place database.

### R6. Dog Walking

- R6.1 When the user enters Map, the system shall show the existing floating dog-walking entry.
- R6.2 When the user taps the dog-walking entry while not walking, the system shall show pet selection before starting location sharing.
- R6.3 When the user has no dog pet, the system shall prompt the user to create or select an eligible dog and shall not start walking.
- R6.4 When the user selects an eligible dog and starts walking, the system shall enter active walking state.
- R6.5 When the user manually ends walking, the system shall stop the active walking state and restore the inactive entry state.
- R6.6 When nearby walking status is queried, the system shall use a 1 km radius from the user's current or simulated location.
- R6.7 When another active walking user is outside the 1 km radius, the system shall not include that user in the nearby result.
- R6.8 When one or more nearby dog walkers exist, the system shall display a privacy-preserving aggregation marker or bubble rather than exact person markers.
- R6.9 When multiple nearby dog walkers are close enough to aggregate, the system shall highlight the aggregate count, such as "nearby 3 walking dogs".
- R6.10 When the user taps the aggregation bubble, the system shall open a compact panel showing only nearby walking pet avatars.
- R6.11 When showing nearby walking results, the system shall not show user nickname, pet nickname, exact coordinate, exact distance, or route.
- R6.12 When a walking session has no position update for 15 minutes, the system shall no longer treat that session as active.
- R6.13 When the mini program is restarted during an active walking state, the system shall recover or clear state in a way that does not show the user as permanently online.

## 6. Non-Functional Requirements

- NFR1. The implementation shall preserve existing working Dress-up and Map flows unless a change is required by this requirements document.
- NFR2. The implementation shall keep unrelated old modules hidden rather than deleting broad unrelated code.
- NFR3. Cloud function responses used by these flows shall fail gracefully in the mini program UI with a loading, toast, or empty state rather than a blank page.
- NFR4. Privacy-sensitive walking data shall be minimized in client-visible responses.
- NFR5. Each development batch shall update the corresponding status in `docs/两模块目标差异清单.md` after implementation and test.

## 7. Acceptance Mapping

| Requirement Area | Manual Test Cases |
|------------------|-------------------|
| R1 Information Architecture | IA-01 to IA-05 |
| R2 Dress-up Pet Basic Information | WP-PET-01 to WP-PET-08 |
| R3 Pet Photos and Visibility | WP-PHOTO-01 to WP-PHOTO-07, EDGE-08 |
| R4 Public Pet Discovery and Likes | WP-FEED-01 to WP-FEED-07, EDGE-05 |
| R5 Pet-Friendly Place Map | MP-PLACE-01 to MP-PLACE-09, MP-DETAIL-01 to MP-DETAIL-06 |
| R6 Dog Walking | MP-WALK-01 to MP-WALK-10, EDGE-01, EDGE-06, EDGE-07 |

## 8. Development Gate

Development shall proceed in batches only after this requirements document is confirmed. The next expected artifact is `specs/two-module-alignment/design.md`, followed by `specs/two-module-alignment/tasks.md`.
