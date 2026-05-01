# Markov Validation Results — Sprint 0 Baseline

## Current State (2026-05-01)

| Flow | Completion | Dead-ends | Avg Steps | Result |
|------|-----------|-----------|-----------|--------|
| Video Edit | 64.4% | 35.6% | 6.6 | ❌ FAIL |
| Content Gen | 62.7% | 37.3% | 6.6 | ❌ FAIL |
| Calendar | 55.9% | 44.1% | 6.4 | ❌ FAIL |
| Asset Upload | 73.8% | 26.2% | 5.4 | ❌ FAIL |
| Analytics | 65.4% | 34.6% | 4.6 | ❌ FAIL |

## Target (post Sprint 1-2 improvements)

| Flow | Completion | Dead-ends | Avg Steps | Result |
|------|-----------|-----------|-----------|--------|
| Video Edit | 90.4% ✅ | 9.6% ❌ | 7.2 ✅ | Partial |
| Content Gen | 85.4% ✅ | 14.6% ❌ | 7.0 ✅ | Partial |
| Calendar | 80.4% ✅ | 19.6% ❌ | 6.6 ✅ | Partial |
| Asset Upload | 91.3% ✅ | 8.7% ✅ | 5.4 ✅ | ✅ PASS |
| Analytics | 76.9% ✅ | 23.1% ❌ | 4.7 ✅ | Partial |

## Required UX Improvements to reach >70% completion AND <10% dead-ends

### 1. Video Edit — Reduce abandonments at "start" and "error"
- **Problem**: 15% abandon at start (unclear what to do)
- **Fix**: Add onboarding tooltip "Sube un video para empezar" with animated arrow
- **Problem**: Error recovery only 60%
- **Fix**: Auto-retry on upload failure, show helpful error messages, save config on error

### 2. Content Generation — Reduce abandonments at "error" and "reject"
- **Problem**: Error recovery only 50%, reject leads to abandon 30%
- **Fix**: Auto-save drafts, "Regenerar" button on reject, suggest alternatives on error
- **Fix**: On reject, auto-suggest: "Quieres modificar algo específico?"

### 3. Calendar Approval — Reduce "reject → abandon" path
- **Problem**: 40% abandon after reject, 15% abandon at start
- **Fix**: Replace "Reject" with "Edit" — always offer edit path
- **Fix**: Auto-save drafts, show "Tienes X borradores pendientes" on start
- **Fix**: One-click approval from email/WhatsApp

### 4. Analytics — Reduce "view_metrics → abandon"
- **Problem**: 15% abandon after viewing metrics (no clear next action)
- **Fix**: Show actionable insights: "Tu mejor horario es 18:00 — Programar ahora"
- **Fix**: Add "Export" and "Schedule content" buttons prominently

### 5. Asset Upload — Nearly passing, reduce "start → abandon"
- **Problem**: 10% abandon at start
- **Fix**: Drag-and-drop with visual feedback, show examples of good assets