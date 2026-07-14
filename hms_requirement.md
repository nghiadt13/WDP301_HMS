# Hotel Management System — Use Case Requirements
## Module: Booking & Check-in (Receptionist)

---

## 2.1. View Booking List

| Field | Detail |
|---|---|
| **UC Code** | UC-014 |
| **UC Name** | View Booking List |
| **Actor** | Receptionist |
| **Description** | Allows the receptionist to view the daily booking list, including upcoming arrivals, current stays, and expected check-outs. |
| **Trigger Event** | The receptionist opens the booking list screen to review daily hotel operations. |

**Preconditions**
- The receptionist is authenticated and authorized.
- Booking data is available in the system.
- The system date or selected operating date is available.

**Main Flow**

| No. | Performed by | Action |
|---|---|---|
| 1 | Receptionist | Opens the booking list function from the receptionist workspace. |
| 2 | System | Displays bookings for the current date, including upcoming arrivals, current stays, and expected check-outs. |
| 3 | Receptionist | Selects a date, booking status, or list category if a filtered view is needed. |
| 4 | System | Refreshes the booking list based on the selected criteria. |
| 5 | Receptionist | Reviews guest name, booking code, room type, stay dates, deposit status, and booking status. |
| 6 | Receptionist | Selects a booking when more details or follow-up processing is required. |

**Alternative Flow**

| No. | Performed by | Action |
|---|---|---|
| 2a | System | If no booking exists for the selected date or status, the system displays an empty list message. |
| 4a | System | If booking data cannot be loaded, the system shows an error message and keeps the previous screen state. |

---

## 2.2. View Booking Detail

| Field | Detail |
|---|---|
| **UC Code** | UC-015 |
| **UC Name** | View Booking Detail |
| **Actor** | Receptionist |
| **Description** | Allows the receptionist to view full details of a selected booking, including guest information, reserved room type, stay dates, deposit status, payment status, special requests, and booking status. |
| **Trigger Event** | The receptionist selects a booking from a booking list or search result. |

**Preconditions**
- The receptionist is authenticated and authorized.
- The selected booking exists in the system.

**Main Flow**

| No. | Performed by | Action |
|---|---|---|
| 1 | Receptionist | Selects a booking to view its detailed information. |
| 2 | System | Retrieves the booking, guest, room, payment, and request information. |
| 3 | System | Displays booking code, guest information, reserved room type, stay dates, booking status, and special requests. |
| 4 | System | Displays deposit status, payment status, assigned room information, and related operational actions when available. |
| 5 | Receptionist | Reviews the information and decides whether to modify, cancel, check in, or return to the previous list. |

**Alternative Flow**

| No. | Performed by | Action |
|---|---|---|
| 2a | System | If the booking no longer exists, the system shows a message and returns the receptionist to the booking list. |
| 4a | System | If some related information is unavailable, the system displays available details and marks missing sections clearly. |

---

## 2.3. Process Check-in

| Field | Detail |
|---|---|
| **UC Code** | UC-021 |
| **UC Name** | Process Check-in |
| **Actor** | Receptionist |
| **Description** | Allows the receptionist to check in a guest by finding the booking, verifying payment status, checking room availability, recording guest identity information, assigning room(s), and changing room status to Occupied. |
| **Trigger Event** | The guest arrives at the hotel and requests check-in for an existing booking. |
| **Includes** | UC-022 (Record/Verify Guest Identity) — invoked at step 5. UC-023 (Create Walk-in Booking) may precede this use case for guests without a prior booking. |

**Preconditions**
- The receptionist is authenticated and authorized.
- The booking exists and has `paymentStatus = Paid`.
- All rooms associated with the booking have `room.status = Available`.
- Guest identity information can be collected.

**Main Flow**

| No. | Performed by | Action |
|---|---|---|
| 1 | Receptionist | Searches for and selects the guest booking. |
| 2 | System | Displays booking details: guest info, room type(s), stay dates, deposit/payment status, booking status. |
| 3 | System | Verifies `booking.paymentStatus = Paid`. If not, blocks check-in (see 3a). |
| 4 | System | Verifies `room.status = Available` for every room included in the booking. If any room is not available, blocks check-in (see 4a). |
| 5 | Receptionist | Invokes **UC-022 (Record/Verify Guest Identity)** for each room/guest in the booking — either confirms identity from an existing `User` account or records new identity info into `StayGuest`. |
| 6 | Receptionist | Assigns the specific available room(s) or confirms previously assigned room(s). |
| 7 | System | Updates `booking.status = Checked-in` (and each `BookingRoom.status = Checked-in` if multi-room). |
| 8 | System | Updates `room.status = Occupied` for every room in the booking. |
| 9 | Receptionist | Hands over the room key(s) to the guest and confirms check-in is complete. |

**Alternative Flow**

| No. | Performed by | Action |
|---|---|---|
| 1a | System | If no matching booking is found, the system shows a message and check-in cannot continue. |
| 3a | System | If `paymentStatus` is not `Paid`, the system blocks check-in and requires payment/deposit handling first. |
| 4a | System | If any room in the booking is not `Available` (still occupied, under cleaning, out of service), the system blocks check-in for the whole booking and clearly indicates which room(s) are not ready. |
| 5a | Receptionist | If guest identity information cannot be collected (no valid ID provided) during UC-022, the receptionist stops check-in and requests valid identification from the guest. |

**Postconditions**
- `booking.status = Checked-in` (and every `BookingRoom.status = Checked-in`).
- All rooms in the booking have `room.status = Occupied`.
- A `StayGuest` record exists for every room, linked to `BookingRoom` (and to `User` when the guest has an account).
- Room key(s) handed over to guest (manual confirmation step, no printed document required).

**Notes / Scope Decisions**
- Special requests (e.g. extra pillows, high floor) are informational only, shown on the Booking Detail screen (UC-015). They are **not** a processing step inside UC-021.
- No registration card / printed document is generated as part of this use case. Output is limited to: recorded guest ID info + room status change + key handover confirmation.
- Walk-in guests are handled by a separate use case, **UC-023 (Create Walk-in Booking)**, which creates the `Booking`/`BookingRoom` records first and then triggers this UC-021 flow immediately afterward.

---

## 2.4. Record/Verify Guest Identity (Include Use Case)

| Field | Detail |
|---|---|
| **UC Code** | UC-022 |
| **UC Name** | Record/Verify Guest Identity |
| **Actor** | Receptionist |
| **Relationship** | `<<include>>` — invoked by UC-021 (Process Check-in), once per room/guest in the booking. Not triggered independently by the actor. |
| **Description** | Records or verifies the identity information (ID/CCCD or passport) of the guest actually staying in a specific room, storing it as a `StayGuest` record linked to that `BookingRoom`. |

**Preconditions**
- A valid `BookingRoom` exists and check-in is in progress (invoked from UC-021).

**Main Flow**

| No. | Performed by | Action |
|---|---|---|
| 1 | System | Checks whether the guest for this room is linked to an existing `User` account (e.g. the booking contact) that already has `id_card_number` / `passport_number` on file. |
| 2a | System | **(Branch A — account with ID already on file)** Displays the stored ID info for the receptionist to visually compare against the guest's physical document. |
| 2b | Receptionist | **(Branch A)** Confirms the displayed information matches the physical document; system creates a `StayGuest` record copied from `User` data, linked to this `BookingRoom` and to `user_id`. |
| 3a | Receptionist | **(Branch B — no ID on file, whether or not the guest has an account)** Enters the ID/CCCD or passport number manually and/or captures a photo of the document. |
| 3b | System | Creates a `StayGuest` record with the entered info, linked to this `BookingRoom` (and to `user_id` if the guest has an account but had no ID on file yet — the `User.id_card_number` is also updated in this case so future stays can use Branch A). |
| 4 | System | Returns control to UC-021 once the `StayGuest` record for this room is saved. |

**Alternative Flow**

| No. | Performed by | Action |
|---|---|---|
| 2c | Receptionist | If the physical document does not match the info on file, treats it as Branch B (re-enter/re-capture current document) rather than reusing stale data. |
| 3c | System | If required identity fields are missing or invalid, rejects the save and prompts the receptionist to re-enter, returning control to UC-021's alternative flow 5a if unresolved. |

**Notes**
- A guest staying in a room does **not** need a `User` account. `StayGuest` can exist purely with entered identity info and no `user_id` link (e.g. a colleague sharing a room with the person who made the booking).
- This use case is intentionally kept generic — it is reused identically whether the booking came from the website, an OTA, or a walk-in (UC-023).

---

## 2.5. Create Walk-in Booking

| Field | Detail |
|---|---|
| **UC Code** | UC-023 |
| **UC Name** | Create Walk-in Booking |
| **Actor** | Receptionist |
| **Description** | Allows the receptionist to create a new booking on the spot for a guest who arrives without a prior reservation, then immediately proceed to check-in. |
| **Trigger Event** | A guest arrives at the front desk requesting a room without an existing booking. |
| **Relationship** | Precedes and triggers UC-021 (Process Check-in) directly upon successful booking creation. |

**Preconditions**
- The receptionist is authenticated and authorized.
- At least one room matching the guest's requested room type is `Available`.

**Main Flow**

| No. | Performed by | Action |
|---|---|---|
| 1 | Receptionist | Selects room type(s), stay dates, and number of rooms requested by the guest. |
| 2 | System | Checks room availability for the requested type(s) and dates. |
| 3 | Receptionist | Confirms rate and collects payment from the guest at the desk. |
| 4 | System | Creates `Booking` with `source = Walk-in`, `status = Confirmed`, `paymentStatus = Paid`, and creates one `BookingRoom` per requested room. |
| 5 | System | Immediately continues into UC-021 (Process Check-in) using the newly created booking. |

**Alternative Flow**

| No. | Performed by | Action |
|---|---|---|
| 2a | System | If no room of the requested type is available, the system informs the receptionist so an alternative room type or another hotel branch can be offered. |
| 3a | Receptionist | If the guest does not complete payment, the booking is not created and the request is not carried forward to check-in. |

---

## 2.6. Business Rules — Check-in Process

| Rule ID | Rule |
|---|---|
| BR-01 | Check-in is only allowed when `booking.paymentStatus = Paid`. Bookings with `Unpaid` status must be blocked from check-in until payment is settled. |
| BR-02 | Before check-in, the system must verify `room.status = Available` for the room(s) to be assigned. Only rooms in `Available` status can be handed over (`Occupied`) to a guest. |
| BR-03 | Guest identity must be recorded at check-in via UC-022, stored as a `StayGuest` record (ID/CCCD or passport number, and/or a captured photo of the document). This is mandatory before check-in can complete. |
| BR-04 | A booking may contain multiple rooms (N ≥ 1), modeled via a `BookingRoom` entity linking `Booking` and `Room`. |
| BR-05 | Check-in is processed **per full booking, not per individual room** — i.e., all rooms in a booking must be `Available` before check-in can proceed. Partial check-in (checking in some rooms while others are still unavailable) is out of scope for this version. |
| BR-06 | Each `BookingRoom` has its own `StayGuest` record(s), since different rooms in the same booking may be occupied by different guests, not just the single booking contact. A `StayGuest` does not require a linked `User` account. |
| BR-07 | Upon successful check-in: `Booking.status`, every `BookingRoom.status`, and every associated `Room.status` are updated atomically (all together, in a single transaction) to `Checked-in` / `Occupied` respectively. |
| BR-08 | Walk-in guests are handled by UC-023 (Create Walk-in Booking), which creates a `Booking` with `source = Walk-in`, `status = Confirmed`, `paymentStatus = Paid`, and then immediately triggers UC-021. No check-in logic is duplicated for walk-ins. |
| BR-09 | If the guest checking in is the account holder (`user_id` on the booking) and their `User` profile already has `id_card_number`/`passport_number` on file, the receptionist only needs to visually verify the document against the stored data (UC-022 Branch A) rather than re-entering it. |
| BR-10 | When a `StayGuest` is created for the booking contact and the linked `User` account has no ID on file yet, the entered ID info is also written back to `User.id_card_number` (or `passport_number`) so it is available for future stays. |

---

## 2.7. Data Model Note — Multi-Room Booking & Guest Identity

To support BR-04 through BR-10, a booking should not map 1-to-1 with a single room, and guest identity captured at check-in should not be forced into the `User` (account) table. Recommended relationship:

```
User (0..1) ---- (0..1) Booking            (booking contact, optional — walk-ins may or may not have an account)
                     |
                     (1) ---- (N) BookingRoom (N) ---- (1) Room
                                     |
                                     └── (1..N) StayGuest
                                              |
                                              └── (0..1) user_id → User   (optional link, only if this guest has an account)
```

- **`User`** (existing schema, unchanged): login/account entity, shared by guests, receptionists, and admins via `role_id`. `id_card_number` / `passport_number` here represent the **account holder's own document**, used to pre-fill/verify future stays (BR-09, BR-10) — not the general storage for every guest at check-in.
- **`Booking`**: booking code, created date, total amount, overall `paymentStatus`, `source` (`Website` / `OTA` / `Walk-in` / ...), optional `user_id` (booking contact — may be `null` for some walk-ins if no account is created).
- **`BookingRoom`**: one row per room included in the booking — `roomType`, `checkInDate`, `checkOutDate`, own `status` lifecycle (`Pending` / `Checked-in` / `Checked-out`).
- **`StayGuest`** (new entity): the actual identity record of whoever is physically staying in a given room, captured at check-in (UC-022). Fields: `full_name`, `id_card_number` or `passport_number`, `id_card_image` (captured photo), `phone_number` (optional), `booking_room_id` (required), `user_id` (optional — only set if this specific guest has an account).

**Why `StayGuest` is separate from `User`:** `User` requires `email` + `password_hash` (login account), which most guests staying in a room — especially those accompanying the booking contact — do not have. Forcing every guest into `User` would mean creating fake login accounts just to record a name and ID number. `StayGuest` removes that constraint while still optionally linking back to `User` when the guest *does* have an account (BR-09/BR-10 reuse path).

**Design decision (chosen):** Check-in requires **all** `BookingRoom` entries in a booking to have their room at `Available` status before any check-in action is allowed (whole-booking check-in). Partial check-in support is explicitly out of scope, to keep data consistency simple for this project's scope — this trade-off should be documented for reviewers.

---

## 2.8. UI Flow & Screen Specification — Check-in

This section defines the exact screen-by-screen behavior for UC-021/UC-022/UC-023, so implementation does not need to infer UI decisions. Follow this order strictly.

### 2.8.1. Entry points (2 separate entry points, do not merge into one button)

| Entry point | Screen | Leads to |
|---|---|---|
| A. From an existing booking | Booking List screen (UC-014) | Booking Detail screen (UC-015) |
| B. Walk-in guest with no booking | A dedicated **"+ New walk-in"** button, always visible on the receptionist workspace/dashboard (not inside the booking list) | Walk-in Booking Form (UC-023) |

These two entry points must **not** share the same button. A walk-in guest is never routed through the booking list, because there is no booking to select yet.

### 2.8.2. Entry point A — Booking List → Booking Detail → Check-in button

**Step A1 — Booking List screen (UC-014):**
- Each row shows: guest name, booking code, room type, stay dates, deposit/payment status, booking status.
- Clicking a row opens Booking Detail (UC-015). No check-in action happens directly from the list row in this version — clicking always opens the detail screen first.

**Step A2 — Booking Detail screen (UC-015):**
- Displays booking code, guest info, room type(s), stay dates, booking status, payment status, and the status of every room in the booking.
- Shows a **"Check-in"** button. Its enabled/disabled state is computed as follows, in this exact order:
  1. If `booking.status` is `Canceled` or `Completed` → button is **hidden** (not just disabled).
  2. Else if `booking.paymentStatus ≠ Paid` → button is **disabled**, with a visible label/tooltip: "Booking not paid" (maps to BR-01 / UC-021 alternative flow 3a).
  3. Else if any room linked to the booking has `room.status ≠ Available` → button is **disabled**, with a visible label/tooltip naming the specific room(s) not ready, e.g. "Room 205 not available" (maps to BR-02 / BR-05 / UC-021 alternative flow 4a).
  4. Else → button is **enabled**.
- These checks must be re-evaluated every time the Booking Detail screen loads or refreshes (not cached from a previous view).
- Clicking the enabled "Check-in" button opens the **Check-in Wizard** (2.8.3), passing the current `booking_id`.

### 2.8.3. Check-in Wizard (shared by both entry points)

The Check-in Wizard is a single modal or dedicated screen with a visible step indicator (e.g. "Step 1 of 3"). Steps run strictly in this order; the receptionist cannot skip ahead to a later step until the current step is completed.

**Wizard Step 1 — Confirm eligibility (re-check, read-only display):**
- Re-displays: payment status (must show `Paid`) and a list of every room in the booking with its current status (must all show `Available`).
- Purpose: final visual confirmation before proceeding, in case anything changed since Booking Detail was loaded.
- If re-check fails here (race condition — e.g. another receptionist just occupied the room), the wizard stops and shows the same blocking message as 2.8.2 step A2.3, and does not allow proceeding to Step 2.
- "Next" button proceeds to Step 2.

**Wizard Step 2 — Record guest identity (UC-022), repeated once per room:**
- If the booking has N rooms, this step has N sub-sections (one per room), shown either as sequential sub-steps within Step 2, or as tabs — implementer's choice, but all N must be completed before "Next" is enabled.
- For each room's sub-section, the system first checks whether the relevant guest is linked to a `User` with an existing `id_card_number`/`passport_number`:
  - **If yes (Branch A):** display the stored ID info read-only, plus a single confirmation control (e.g. checkbox "Matches physical document"). Receptionist must check it to proceed. If it does NOT match, the receptionist switches to Branch B for that room (do not silently reuse stale data).
  - **If no (Branch B):** show input fields for ID/passport number (text input) and an image upload/capture control for the ID photo. Both must be filled before this room's sub-section is marked complete.
- "Next" button on Step 2 is only enabled once every room's sub-section is marked complete.

**Wizard Step 3 — Assign/confirm room(s):**
- For each room in the booking, show the room already assigned at booking time (if any) as pre-selected, or a dropdown/list of currently `Available` rooms of the matching room type if none was pre-assigned.
- Receptionist confirms or changes the assignment for each room.
- "Next" button proceeds to Step 4.

**Wizard Step 4 — Final confirmation:**
- Shows a summary: guest(s), room(s) assigned, dates.
- A single **"Complete check-in"** button triggers the backend action that performs BR-07 (atomic update: `Booking.status`, all `BookingRoom.status` → `Checked-in`, all `Room.status` → `Occupied`).
- On success, show a confirmation screen/toast with room number(s) and a manual **"Key handed over"** confirmation action (a simple button/checkbox the receptionist clicks after physically handing over the key — no document is printed or generated).
- On failure (e.g. server error), show an error message and keep the wizard on Step 4 so no data is lost.

### 2.8.4. Entry point B — Walk-in Booking Form → Check-in Wizard

**Step B1 — Walk-in Booking Form (UC-023):**
- Fields: room type(s), number of rooms, stay dates, rate confirmation, payment collection.
- On submit, the system creates `Booking` (`source = Walk-in`, `status = Confirmed`, `paymentStatus = Paid`) and one `BookingRoom` per requested room.

**Step B2 — Auto-continue directly into Check-in Wizard:**
- Immediately after B1 succeeds, the system opens the same Check-in Wizard from 2.8.3, **starting at Step 2** (identity recording) — Step 1 (eligibility re-check) is skipped because the booking was just created with `Paid` status and rooms were just validated as available in UC-023 step 2.
- From here on, the flow is identical to entry point A: Step 2 → Step 3 → Step 4, same rules, same components.

### 2.8.5. Summary table — which screen enforces which rule

| Screen / Step | Rule enforced |
|---|---|
| Booking Detail — Check-in button state | BR-01 (payment), BR-02 + BR-05 (all rooms available) |
| Wizard Step 1 | Re-check of BR-01, BR-02, BR-05 (race-condition safety) |
| Wizard Step 2 | BR-03, BR-06, BR-09, BR-10 (identity per room, via UC-022) |
| Wizard Step 3 | Room assignment (part of UC-021 step 6) |
| Wizard Step 4 | BR-07 (atomic status update), key handover confirmation |
| Walk-in Form (B1) | Creates booking already satisfying BR-01/BR-02 (UC-023) |

---

- **Entities referenced:** `User`, `Booking`, `BookingRoom`, `Room`, `Room Type`, `StayGuest`, Payment/Deposit, Special Request.
- **Status fields involved:**
  - Booking status: e.g. `Pending`, `Confirmed`, `Checked-in`, `Canceled`, `Completed`.
  - BookingRoom status (per room, own lifecycle): `Pending`, `Checked-in`, `Checked-out`.
  - Room status: `Available`, `Occupied` (plus housekeeping-related statuses outside this module's scope, e.g. under cleaning).
  - Payment status: `Paid`, `Unpaid`.
- **Use case map:**
  - UC-014 (View Booking List) → UC-015 (View Booking Detail) via booking selection (step 6 of UC-014 → step 1 of UC-015). UC-015 supports the decision to proceed to UC-021 (check-in), a cancel use case, or a modify use case.
  - UC-021 (Process Check-in) `<<include>>` UC-022 (Record/Verify Guest Identity) — invoked once per room/guest.
  - UC-023 (Create Walk-in Booking) triggers UC-021 directly upon successful booking creation, reusing the same check-in flow and the same UC-022 include — no duplicated check-in logic for walk-ins.
- **Check-in gating rules (BR-01, BR-02, BR-05):** Check-in is blocked unless the booking is fully paid AND every room in the booking is `Available`. This applies uniformly whether the booking originated online or via UC-023 walk-in.
- **Identity handling (BR-03, BR-06, BR-09, BR-10):** Identity is captured per `StayGuest`, not per `User`. `User.id_card_number`/`passport_number` is only ever populated for the account holder, and only ever used to speed up verification for that same person's future stays — it is not the general-purpose store for all guests in a booking.
- **Error handling pattern:** All use cases in this module follow a consistent pattern — empty/missing data states are handled gracefully (empty list, missing sections marked, blocked actions with a stated reason) rather than hard failures.
- **UI implementation:** See section 2.8 for the exact screen-by-screen flow and wizard step order. Do not invent alternative UI structures (e.g. single-page check-in, combined entry points) — 2.8 is authoritative.
