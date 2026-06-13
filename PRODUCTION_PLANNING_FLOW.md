# Production Planning - Complete Flow with Edit & Adjustment Options

**Detailed workflow showing all possible states, edits, and adjustments**

---

## Overview

```
Sales Order Creation
    ↓
Sales Order Edit (Qty, Dates, Items)
    ↓
Lock BOM
    ↓
Submit SO
    ↓
Approve SO ← Manager Approval Point
    ↓
Generate Demand
    ↓
PRODUCTION PLANNING HUB
    ├─ Create Plan from Demand
    ├─ Edit Demand (if needed)
    ├─ Edit Plan (Qty, Dates, Work Center)
    ├─ Approve Plan ← PPIC Manager Approval
    ├─ Edit Approved Plan (if adjustment needed)
    ├─ Generate Batch
    ├─ Edit Batch (if needed before release)
    └─ Release Batch
        ↓
    Batch Execution (Production)
        ├─ Start Batch
        ├─ Complete Batch
        └─ QC Inspection
```

---

## Detailed Flow with All Options

### Phase 1: Sales Order Management

#### Step 1.1: Create Sales Order

**Endpoint:** `POST /api/sales-orders`

```json
{
  "so_type": "MTO",
  "customer_id": 1,
  "product_id": 1,
  "qty": 100,
  "nilai": 50000000,
  "tgl_order": "2026-06-12",
  "tgl_kirim": "2026-06-20",
  "prioritas": "Tinggi",
  "items": [
    {
      "product_id": 1,
      "qty_ordered": 100,
      "unit_price": 500000,
      "delivery_date": "2026-06-20"
    }
  ]
}
```

**Result:**
- SO created with status = **Draft**
- SO number auto-generated: `SO-BKS-20260612-0001`
- Items stored but BOM NOT locked yet
- Available for editing

---

#### Step 1.2: EDIT Sales Order (IF NEEDED)

**Endpoint:** `PUT /api/sales-orders/{id}`

**Can Edit (Draft status only):**
```json
{
  "nilai": 55000000,
  "tgl_kirim": "2026-06-25",
  "items": [
    {
      "product_id": 1,
      "qty_ordered": 120,
      "unit_price": 500000,
      "delivery_date": "2026-06-25"
    }
  ]
}
```

**Cannot Edit:**
- ❌ SO number (auto-generated, read-only)
- ❌ Status (controlled by workflow)
- ❌ Customer (once locked)

**Can Delete:**
- ✅ Delete entire SO if status = Draft

**Result:**
- Items updated
- Quantities changed
- Delivery dates adjusted
- Still in Draft, ready for next step

---

#### Step 1.3: Lock BOM

**Endpoint:** `POST /api/sales-orders/{id}/lock-bom`

**What happens:**
- Searches for active BOM for each product
- Attaches BOM to each SO item
- Creates snapshot of BOM version
- If BOM missing → Error (cannot proceed)

**Result:**
```json
{
  "locked": ["Product A", "Product B"],
  "missing": [],
  "so": {
    "items": [
      {
        "bom_header_id": 1,
        "bom_version_snapshot": "1.0"
      }
    ]
  }
}
```

**If Error:**
```json
{
  "locked": [],
  "missing": ["Product A - No active BOM"],
  "so": { ... }
}
```
**Action Needed:** Create/activate BOM, then lock again

---

#### Step 1.4: Submit SO

**Endpoint:** `POST /api/sales-orders/{id}/submit`

**Status Flow:**
- `Draft` → `Submitted`

**What's locked:**
- ✅ Cannot edit anymore
- ✅ Cannot change items
- ✅ Cannot delete

**Result:**
- SO submitted for approval
- Ready for manager review

---

#### Step 1.5: Approve SO (Manager)

**Endpoint:** `POST /api/sales-orders/{id}/confirm`

**Permission Required:** `sales.approve`

**Status Flow:**
- `Submitted` → `Approved`

**Result:**
- SO ready for demand generation
- Can now proceed to production planning

---

### Phase 2: Demand Generation

#### Step 2.1: Generate Demand from Approved SO

**Endpoint:** `POST /api/sales-orders/{id}/generate-demands`

**Prerequisites:**
- SO status must be `Approved`
- Each item must have locked BOM
- BOM must be active (not draft/archived)
- BOM must have at least 1 material

**What happens:**
- Creates ProductionDemand for each SO item
- Demand number: `DEMAND-SO-SO-BKS-20260612-0001-1`
- Maps SO priority to Demand priority:
  - Tinggi → 3 (highest)
  - Sedang → 5 (medium)
  - Rendah → 7 (lowest)
- Sets demand quantity from SO item qty_ordered
- Sets required date from SO item delivery_date

**Result:**
```json
{
  "message": "Demands generated successfully",
  "so": {
    "status": "Planning",
    "demands": [
      {
        "id": 1,
        "demand_number": "DEMAND-SO-SO-BKS-20260612-0001-1",
        "product_id": 1,
        "demand_qty": 100,
        "required_date": "2026-06-25",
        "priority": 3,
        "status": "Open"
      }
    ]
  }
}
```

**Demands now appear in:**
- Production Planning Hub → **Demand Queue Tab**

---

### Phase 3: Production Planning Hub

#### Step 3.1: View Demand in Queue

**Location:** Production Planning Hub → Demand Queue Tab

**Display:**
```
Demand No                | SO No              | Product    | Qty | Due Date   | Priority | Status
DEMAND-SO-...0001-1     | SO-BKS-...-0001   | Product A  | 100 | 2026-06-25 | 3        | Open
```

**Available Actions:**
- ✅ Create Plan (button for each row)
- ❌ Cannot edit demand directly from here
- ❌ Cannot delete demand directly

---

#### Step 3.2: EDIT Demand (IF NEEDED - Optional)

**Endpoint:** `PUT /api/production-demands/{id}`

**Can Edit (Open status only):**
```json
{
  "demand_qty": 120,
  "required_date": "2026-06-28",
  "priority": 5,
  "notes": "Customer requested more qty"
}
```

**Cannot Edit:**
- ❌ Demand number (read-only)
- ❌ Source type (read-only)
- ❌ Product ID (read-only)

**Can Delete:**
- ✅ Delete demand if status = Open
- ❌ Cannot delete if status = Planned (already in plan)

**Result:**
- Demand updated with new qty, date, priority
- Ready to create plan with updated values

---

#### Step 3.3: Create Plan from Demand

**Endpoint:** `POST /api/production-demands/{id}/create-plan`

**Prerequisites:**
- Demand status must be `Open`

**What happens:**
- Creates ProductionPlan from demand data:
  - plan_number: `PLAN-1-1-20260612143022`
  - plan_level: `Daily`
  - period_start: TODAY
  - period_end: demand.required_date
  - product_id: from demand
  - planned_qty: from demand.demand_qty
  - planned_volume_m3: calculated from product specs
  - status: `Draft`

- Updates demand status: `Open` → `Planned`

**Result:**
```json
{
  "message": "Production plan created",
  "plan": {
    "id": 1,
    "plan_number": "PLAN-1-1-20260612143022",
    "plan_level": "Daily",
    "product_id": 1,
    "planned_qty": 120,
    "period_start": "2026-06-12",
    "period_end": "2026-06-28",
    "status": "Draft"
  },
  "demand": {
    "status": "Planned"
  }
}
```

**Plan now appears in:**
- Production Planning Hub → **Production Plans Tab** with status `Draft`

---

#### Step 3.4: EDIT Plan (IF NEEDED - Optional)

**Endpoint:** `PUT /api/production-plans/{id}`

**Can Edit (Draft status only):**
```json
{
  "planned_qty": 150,
  "work_center_id": 2,
  "period_end": "2026-06-30",
  "notes": "Adjusted for capacity"
}
```

**Cannot Edit:**
- ❌ plan_number (read-only)
- ❌ product_id (read-only)
- ❌ period_start (derived from creation date)

**Can Delete:**
- ✅ Delete plan if status = Draft
- ❌ Cannot delete if status = Approved/Released

**Static Fields (not auto-calculated in v1):**
- material_status: Manual (Ready/Partial/Not Ready)
- capacity_status: Manual (Available/Overload)

**Result:**
- Plan updated with new qty, work center, dates
- Ready for approval with adjusted parameters

---

#### Step 3.5: Approve Plan (PPIC Manager)

**Endpoint:** `POST /api/production-plans/{id}/approve`

**Permission Required:** `planning.manage`

**Prerequisites:**
- Plan status must be `Draft`

**Status Flow:**
- `Draft` → `Approved`

**What happens:**
- Validates plan structure
- Approves for batch generation
- No further editing allowed

**Result:**
- Plan status: `Approved`
- Next action available: "Generate Batch"

---

#### Step 3.6: EDIT Approved Plan (IF ADJUSTMENT NEEDED - Optional)

**Scenario:** After approval, customer calls with last-minute changes

**Endpoint:** `PUT /api/production-plans/{id}`

**Can Edit (Approved status allows limited edits):**
```json
{
  "planned_qty": 160,
  "work_center_id": 3,
  "notes": "Last-minute adjustment before batch generation"
}
```

**Available Edits:**
- ✅ Adjust quantity (if capacity allows)
- ✅ Change work center (if available)
- ✅ Extend deadline
- ✅ Add notes

**Cannot Change:**
- ❌ Product (tied to demand)
- ❌ Status (must stay Approved)

**Can Reject Plan:**
- ✅ Option: Go back to Draft for major changes
- ✅ Delete plan and create new one from demand

**Result:**
- Plan adjusted with new parameters
- Still Approved, ready to proceed

---

#### Step 3.7: Generate Batch from Plan

**Endpoint:** `POST /api/production-plans/{id}/generate-batch`

**Prerequisites:**
- Plan status must be `Approved`

**What happens:**
- Creates ProductionBatch:
  - batch_number: `BATCH-00001-20260612143022`
  - production_plan_id: links to plan
  - product_id: from plan
  - target_qty: from plan.planned_qty
  - target_volume_m3: from plan
  - planned_start: from plan.period_start
  - planned_end: from plan.period_end
  - work_center_id: from plan (if set)
  - status: `Planned`

- Creates ProductionCost record (1:1 with batch)

- Updates plan status: `Approved` → `Released`

**Result:**
```json
{
  "message": "Batch generated successfully",
  "batch": {
    "id": 1,
    "batch_number": "BATCH-00001-20260612143022",
    "production_plan_id": 1,
    "product_id": 1,
    "target_qty": 160,
    "planned_start": "2026-06-12",
    "planned_end": "2026-06-30",
    "status": "Planned"
  }
}
```

**Batch now appears in:**
- Production Planning Hub → **Production Batches Tab** with status `Planned`
- Plan status shows: `Released` (no more edits allowed)

---

#### Step 3.8: EDIT Batch (IF NEEDED - Optional)

**Endpoint:** `PUT /api/production-batches/{id}`

**Can Edit (Planned status only):**
```json
{
  "target_qty": 170,
  "work_center_id": 2,
  "planned_start": "2026-06-13",
  "planned_end": "2026-07-01",
  "notes": "Rescheduled due to equipment maintenance"
}
```

**Cannot Edit:**
- ❌ batch_number (read-only)
- ❌ product_id (read-only)
- ❌ status (workflow controlled)

**Can Delete:**
- ✅ Delete batch if status = Planned
- ❌ Cannot delete if Released or In Progress

**Cost Adjustment:**
- Can add/update cost estimates before release

**Result:**
- Batch adjusted with new parameters
- Still in Planned status, can make more changes

---

### Phase 4: Batch Execution

#### Step 4.1: Release Batch

**Endpoint:** `POST /api/production-batches/{id}/release`

**Prerequisites:**
- Batch status must be `Planned`
- No more edits allowed after this point

**Status Flow:**
- `Planned` → `Released`

**What happens:**
- Batch locked for execution
- Cannot edit batch parameters anymore
- Ready to start production

**Result:**
```json
{
  "message": "Batch released",
  "status": "Released"
}
```

---

#### Step 4.2: Start Batch (Begin Production)

**Endpoint:** `POST /api/production-batches/{id}/start`

**Prerequisites:**
- Batch status must be `Released`
- Set actual_start = NOW()

**Status Flow:**
- `Released` → `In Progress`

**What happens:**
- Production starts
- actual_start timestamp recorded
- Cannot stop mid-production (no cancel endpoint)

**Result:**
```json
{
  "message": "Batch started",
  "status": "In Progress",
  "actual_start": "2026-06-12T14:30:00Z"
}
```

---

#### Step 4.3: Complete Batch (End Production)

**Endpoint:** `POST /api/production-batches/{id}/complete`

**Prerequisites:**
- Batch status must be `In Progress`

**Required Input:**
```json
{
  "actual_qty": 165
}
```

**Status Flow:**
- `In Progress` → `QC Pending`

**What happens:**
- actual_qty recorded (can be different from target_qty)
- actual_end timestamp = NOW()
- Batch sent to QC for inspection

**Result:**
```json
{
  "message": "Batch completed, awaiting QC",
  "status": "QC Pending",
  "actual_qty": 165,
  "actual_end": "2026-06-12T18:30:00Z"
}
```

---

### Phase 5: Quality Control & Beyond

#### Step 5.1: QC Inspection (Separate Module)

**Next Steps (Outside Production Planning):**
- QC Staff inspects batch
- Records defects/issues
- Approves or rejects batch

**Status Flow:**
- `QC Pending` → `Completed` (if passed)
- `QC Pending` → `Rejected` (if failed - batch scrapped/reworked)

---

#### Step 5.2: Delivery Order

**After QC Approval:**
- Delivery Order generated
- Batch linked to delivery
- Sent to customer
- Status: `Closed` (final)

---

## Summary of Editing Capabilities

### What CAN be edited at each stage:

```
SALES ORDER (Draft)
├─ Quantity
├─ Price/Value
├─ Delivery Date
├─ Items
└─ Priority

DEMAND (Open)
├─ Quantity
├─ Required Date
├─ Priority
└─ Notes

PLAN (Draft)
├─ Quantity
├─ Dates (period_start, period_end)
├─ Work Center
├─ Notes
└─ Material/Capacity Status (manual)

PLAN (Approved)
├─ Quantity (limited)
├─ Work Center
├─ Dates (can extend)
└─ Notes

BATCH (Planned)
├─ Quantity
├─ Dates (planned_start, planned_end)
├─ Work Center
├─ Cost Estimates
└─ Notes

BATCH (Released/In Progress/QC Pending)
└─ Cannot Edit (locked)
```

---

## What CANNOT be changed once set:

```
SALES ORDER
├─ SO Number (auto-generated)
├─ Status (once submitted)
└─ BOM (once locked)

DEMAND
├─ Demand Number
├─ Source Type
├─ Product ID
├─ Sales Order Link
└─ Status (once Planned)

PLAN
├─ Plan Number
├─ Product ID
└─ Demand Link

BATCH
├─ Batch Number
├─ Product ID
├─ Plan Link
└─ Status (workflow controlled)
```

---

## Error Scenarios & Recovery

### Scenario 1: Wrong Quantity in SO
```
Error Path:
1. Create SO with qty=100
2. Realize should be qty=150
   ✅ Edit SO (if Draft)
   ✅ Lock BOM again
   ✅ Submit → Approve → Generate Demand
   → New demand created with qty=150
```

### Scenario 2: No Active BOM
```
Error Path:
1. Submit SO with product that has no BOM
2. Error: "BOM belum memiliki BOM aktif"
   ✅ Action: Create/Activate BOM
   ✅ Try lock-bom again
   ✅ Then continue workflow
```

### Scenario 3: Demand needs adjustment before plan
```
Error Path:
1. Demand created with qty=100
2. Realize should be qty=120
   ✅ Edit demand directly (PUT /api/production-demands/{id})
   ✅ Then create plan with new qty
   → Plan created with qty=120
```

### Scenario 4: Plan needs adjustment before batch
```
Error Path:
1. Plan created with qty=100, work_center=1
2. Work center 1 unavailable
   ✅ Edit plan directly (PUT /api/production-plans/{id})
   ✅ Change work_center_id to 2
   ✅ Then generate batch
   → Batch created with work_center=2
```

### Scenario 5: Batch needs adjustment before release
```
Error Path:
1. Batch created with qty=100
2. Realize qty should be 120, dates changed
   ✅ Edit batch directly (PUT /api/production-batches/{id})
   ✅ Update target_qty, planned_start, planned_end
   ✅ Then release batch
   → Batch released with new parameters
```

### Scenario 6: Need to cancel and restart
```
Error Path:
1. Plan in Draft, realize major changes needed
   ✅ DELETE plan (if Draft)
   ✅ Back to Demand Queue
   ✅ Create new plan with corrected demand
   → New plan created
```

---

## State Diagram - All Possible Paths

```
SO Draft ──Edit──> SO Draft
    │
    └─Submit──> SO Submitted
                    │
                    └─Approve──> SO Approved
                                   │
                                   └─Generate Demands──> Demand Open
                                                            │
                                      ┌─────────────────────┤
                                      │                     │
                                   Edit (if needed)   Create Plan
                                      │                     │
                                      └─────────────────────┘
                                                │
                                        Plan Draft
                                            │
                                ┌───────────┼───────────┐
                                │           │           │
                             Delete      Edit      Approve
                                │           │           │
                                └─ Back    │           │
                                          │           │
                                    Plan Draft    Plan Approved
                                                    │
                                        ┌───────────┼───────────┐
                                        │           │           │
                                      Edit    Generate Batch    (no edits, wait)
                                        │           │
                                        └───────────┘
                                                │
                                        Plan Released
                                                │
                                        Batch Planned
                                                │
                                ┌───────────────┼───────────────┐
                                │               │               │
                             Delete          Edit           Release
                                │               │               │
                                └─ Back ────────┘               │
                                                        Batch Released
                                                                │
                                                            Start
                                                                │
                                                        Batch In Progress
                                                                │
                                                            Complete
                                                                │
                                                        Batch QC Pending
                                                                │
                                                        (QC Module)
                                                                │
                                                        Batch Completed/Rejected
                                                                │
                                                        Delivery Order
                                                                │
                                                        Batch Closed
```

---

## Permission Matrix

| Action | Role | Permission |
|--------|------|-----------|
| Create SO | Sales Staff | sales.manage |
| Edit SO (Draft) | Sales Staff | sales.manage |
| Submit SO | Sales Staff | sales.manage |
| Approve SO | Manager | sales.approve |
| Lock BOM | Sales Staff | sales.manage |
| Generate Demands | PPIC | planning.manage |
| Create Plan | PPIC | planning.manage |
| Edit Demand | PPIC | planning.manage |
| Edit Plan | PPIC | planning.manage |
| Approve Plan | PPIC Manager | planning.manage |
| Generate Batch | PPIC | planning.manage |
| Edit Batch | PPIC | planning.manage |
| Release Batch | PPIC/Production | batch.manage |
| Start Batch | Production | batch.manage |
| Complete Batch | Production | batch.manage |

---

## Key Takeaways

✅ **High Flexibility Before Release**
- Can edit SO until submitted
- Can edit Demand while Open
- Can edit Plan until Approved
- Can edit Plan even after Approved (if minor changes)
- Can edit Batch until Released

✅ **Locked After Release**
- Once batch Released → Production Locked
- Cannot change quantity, dates, or work center mid-production
- Can only proceed through states: Released → In Progress → QC Pending

✅ **Multiple Recovery Options**
- Delete and restart at any Draft stage
- Go back to previous tab to edit before proceeding
- Make corrections at each step before moving forward

✅ **Audit Trail**
- All state changes logged
- All edits recorded
- Full traceability from SO to Batch completion

---

**This flow provides both structure and flexibility for production planning!**
