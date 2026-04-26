# Security Specification: Nicola Hub

## 1. Data Invariants
- **Multi-Tenant Isolation**: No user can read, list, or write to any document that does not belong to them (enforced via `authorId`).
- **Schema Integrity**: Every document must strictly follow the defined schema in `firebase-blueprint.json`.
- **Relational Integrity**: `authorId` must always match the authenticated user's UID.
- **Immutable Origins**: Fields like `createdAt` and `authorId` cannot be changed after creation.
- **Temporal Integrity**: `updatedAt` and `createdAt` must be server-validated using `request.time`.

## 2. The "Dirty Dozen" Payloads

### P1: Identity Spoofing (Create Post for Others)
- **Target**: `/posts/{postId}`
- **Payload**: `{ "authorId": "attacker_id", "content": "Attacker content", ... }`
- **Expected Outcome**: `PERMISSION_DENIED` (Rule verifies `authorId == request.auth.uid`).

### P2: Rogue Key Injection
- **Target**: `/posts/{postId}`
- **Payload**: `{ ..., "isAdmin": true }`
- **Expected Outcome**: `PERMISSION_DENIED` (Key count and `keys().hasAll()` enforce strict schema).

### P3: Mass Deletion / List Scrape
- **Operation**: `getDocs(collection(db, 'posts'))` without `where('authorId', '==', uid)`
- **Expected Outcome**: `PERMISSION_DENIED` (Rule enforces `resource.data.authorId == request.auth.uid` on list).

### P4: Resource Exhaustion (ID Poisoning)
- **Target**: `/posts/12345...[2KB_STRING]`
- **Expected Outcome**: `PERMISSION_DENIED` (`isValidId()` constrains ID size and characters).

### P5: Outcome Shortcut (Override Status)
- **Target**: `/posts/{postId}`
- **Payload**: `{ "status": "published" }` (when logic expects 'ready')
- **Expected Outcome**: `PERMISSION_DENIED` (Update actions are gated by `affectedKeys()`).

### P6: PII Leak (Read Assets metadata)
- **Target**: `/assets/{assetId}`
- **Expected Outcome**: `PERMISSION_DENIED` (unless requester is the owner).

### P7: Ghost Asset Creation
- **Target**: `/assets/{assetId}`
- **Payload**: Missing `url` or `authorId`.
- **Expected Outcome**: `PERMISSION_DENIED` (Schema check).

### P8: Global Analytics Tampering
- **Target**: `/analytics/summary`
- **Operation**: `updateDoc` as non-admin.
- **Expected Outcome**: `PERMISSION_DENIED` (`isAdmin()` restricts writing).

### P9: Methodology Theft
- **Target**: `/methodology/{id}`
- **Operation**: `read` as different user.
- **Expected Outcome**: `PERMISSION_DENIED`.

### P10: Timestamp Spoofing
- **Target**: `/posts/{postId}`
- **Payload**: `{ "createdAt": "2000-01-01T00:00:00Z" }`
- **Expected Outcome**: `PERMISSION_DENIED` (`request.time` mismatch).

### P11: Large String Injection
- **Target**: `/posts/{postId}`
- **Payload**: `{ "content": "..." }` (10MB string)
- **Expected Outcome**: `PERMISSION_DENIED` (`.size()` constraint).

### P12: Action Bypass
- **Target**: `/posts/{postId}`
- **Payload**: Updating `createdAt` during a content edit.
- **Expected Outcome**: `PERMISSION_DENIED` (Immutability check).

## 3. Red Team Audit Checklist (Phase 5)
- [ ] **Identity Spoofing Test**: Pass
- [ ] **State Shortcutting Test**: Pass
- [ ] **Resource Poisoning Test**: Pass
- [ ] **PII Blanket Test**: Pass
- [ ] **Query Trust Test**: Pass
