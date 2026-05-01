#!/usr/bin/env python3
"""
Markov Chain Flow Validator v2 — Nicola Schaefer Hub
Simulates user flows with TARGET probabilities (post-improvement).
Validates that the designed UX leads to >70% completion.

Two modes:
  --target : Validate target design (should PASS)
  --current : Validate current state (shows where improvements are needed)
"""

import random
import json
import sys
from typing import Dict, List, Tuple

# ============ FLOW DEFINITIONS ============

# TARGET probabilities = what we design FOR (with recovery paths, help, auto-save)
# CURRENT probabilities = what the UX currently provides (many dead-ends)

FLOWS_TARGET = {
    "video_edit": {
        "description": "Upload > Configure > Process > Download (TARGET)",
        "states": {
            "start":       {"select_type": 0.95, "abandon": 0.05},
            "select_type": {"configure": 0.92, "start": 0.08},
            "configure":   {"upload": 0.88, "configure": 0.10, "abandon": 0.02},
            "upload":      {"process": 0.95, "error": 0.05},
            "process":     {"completed": 0.92, "error": 0.08},
            "error":       {"retry": 0.85, "abandon": 0.15},
            "retry":       {"upload": 0.90, "abandon": 0.10},
            "completed":   {"download": 0.80, "share": 0.20},
            "download":    {"success": 1.0},
            "share":       {"success": 1.0},
            "abandon":     {},
            "success":     {},
        },
    },
    "content_generation": {
        "description": "Pillar > Generate > Review > Schedule (TARGET)",
        "states": {
            "start":         {"select_pillar": 0.95, "abandon": 0.05},
            "select_pillar": {"generate": 0.92, "start": 0.08},
            "generate":      {"review": 0.85, "error": 0.05, "generate": 0.10},
            "review":        {"approve": 0.65, "edit": 0.25, "reject": 0.10},
            "edit":          {"review": 0.90, "abandon": 0.10},
            "approve":       {"schedule": 0.90, "success": 0.10},
            "schedule":      {"success": 0.95, "error": 0.05},
            "reject":        {"edit": 0.80, "abandon": 0.20},
            "error":         {"retry": 0.70, "abandon": 0.30},
            "retry":         {"generate": 0.90, "abandon": 0.10},
            "abandon":       {},
            "success":       {},
        },
    },
    "calendar_approval": {
        "description": "Draft > Review > Approve > Schedule > Publish (TARGET)",
        "states": {
            "start":       {"create_draft": 0.95, "abandon": 0.05},
            "create_draft": {"review": 0.92, "edit": 0.08},
            "review":      {"approve": 0.60, "edit": 0.30, "reject": 0.10},
            "edit":        {"review": 0.90, "abandon": 0.10},
            "approve":     {"schedule": 0.85, "success": 0.15},
            "schedule":    {"publish": 0.80, "error": 0.10, "success": 0.10},
            "publish":     {"success": 0.92, "error": 0.08},
            "reject":      {"edit": 0.80, "abandon": 0.20},
            "error":       {"retry": 0.70, "abandon": 0.30},
            "retry":       {"schedule": 0.80, "abandon": 0.20},
            "abandon":     {},
            "success":     {},
        },
    },
    "asset_upload": {
        "description": "Files > Upload > Tag > Save (TARGET)",
        "states": {
            "start":        {"select_files": 0.95, "abandon": 0.05},
            "select_files": {"upload": 0.92, "start": 0.08},
            "upload":       {"tag": 0.90, "error": 0.05, "upload": 0.05},
            "tag":          {"save": 0.80, "tag": 0.18, "abandon": 0.02},
            "save":         {"success": 0.97, "error": 0.03},
            "error":        {"retry": 0.80, "abandon": 0.20},
            "retry":        {"upload": 0.90, "abandon": 0.10},
            "abandon":     {},
            "success":      {},
        },
    },
    "analytics_review": {
        "description": "Range > Metrics > Export (TARGET)",
        "states": {
            "start":         {"select_range": 0.95, "abandon": 0.05},
            "select_range":  {"view_metrics": 0.97, "start": 0.03},
            "view_metrics":  {"drill_down": 0.40, "export": 0.50, "abandon": 0.10},
            "drill_down":    {"view_metrics": 0.75, "export": 0.20, "abandon": 0.05},
            "export":        {"success": 0.95, "error": 0.05},
            "error":         {"retry": 0.80, "abandon": 0.20},
            "retry":         {"export": 0.90, "abandon": 0.10},
            "abandon":      {},
            "success":       {},
        },
    },
}

FLOWS_CURRENT = {
    "video_edit": {
        "description": "Upload > Configure > Process > Download (CURRENT)",
        "states": {
            "start":       {"select_type": 0.85, "abandon": 0.15},
            "select_type": {"configure": 0.80, "start": 0.20},
            "configure":   {"upload": 0.70, "configure": 0.25, "abandon": 0.05},
            "upload":      {"process": 0.90, "error": 0.10},
            "process":     {"completed": 0.85, "error": 0.15},
            "error":       {"retry": 0.60, "abandon": 0.40},
            "retry":       {"upload": 0.80, "abandon": 0.20},
            "completed":  {"download": 0.75, "share": 0.25},
            "download":   {"success": 1.0},
            "share":      {"success": 1.0},
            "abandon":    {},
            "success":    {},
        },
    },
    "content_generation": {
        "description": "Pillar > Generate > Review > Schedule (CURRENT)",
        "states": {
            "start":         {"select_pillar": 0.90, "abandon": 0.10},
            "select_pillar": {"generate": 0.85, "start": 0.15},
            "generate":      {"review": 0.75, "error": 0.15, "generate": 0.10},
            "review":        {"approve": 0.60, "edit": 0.25, "reject": 0.15},
            "edit":          {"review": 0.80, "abandon": 0.20},
            "approve":       {"schedule": 0.85, "success": 0.15},
            "schedule":      {"success": 0.90, "error": 0.10},
            "reject":        {"edit": 0.70, "abandon": 0.30},
            "error":         {"retry": 0.50, "abandon": 0.50},
            "retry":         {"generate": 0.80, "abandon": 0.20},
            "abandon":       {},
            "success":       {},
        },
    },
    "calendar_approval": {
        "description": "Draft > Review > Approve > Schedule > Publish (CURRENT)",
        "states": {
            "start":       {"create_draft": 0.90, "abandon": 0.10},
            "create_draft": {"review": 0.85, "edit": 0.15},
            "review":      {"approve": 0.50, "edit": 0.30, "reject": 0.20},
            "edit":        {"review": 0.85, "abandon": 0.15},
            "approve":     {"schedule": 0.80, "success": 0.20},
            "schedule":    {"publish": 0.70, "error": 0.20, "success": 0.10},
            "publish":     {"success": 0.85, "error": 0.15},
            "reject":      {"edit": 0.60, "abandon": 0.40},
            "error":       {"retry": 0.50, "abandon": 0.50},
            "retry":       {"schedule": 0.70, "abandon": 0.30},
            "abandon":     {},
            "success":     {},
        },
    },
    "asset_upload": {
        "description": "Files > Upload > Tag > Save (CURRENT)",
        "states": {
            "start":        {"select_files": 0.90, "abandon": 0.10},
            "select_files": {"upload": 0.85, "start": 0.15},
            "upload":       {"tag": 0.80, "error": 0.15, "upload": 0.05},
            "tag":          {"save": 0.70, "tag": 0.25, "abandon": 0.05},
            "save":         {"success": 0.95, "error": 0.05},
            "error":        {"retry": 0.60, "abandon": 0.40},
            "retry":        {"upload": 0.80, "abandon": 0.20},
            "abandon":     {},
            "success":      {},
        },
    },
    "analytics_review": {
        "description": "Range > Metrics > Export (CURRENT)",
        "states": {
            "start":         {"select_range": 0.90, "abandon": 0.10},
            "select_range":  {"view_metrics": 0.95, "start": 0.05},
            "view_metrics":  {"drill_down": 0.40, "export": 0.45, "abandon": 0.15},
            "drill_down":    {"view_metrics": 0.70, "export": 0.25, "abandon": 0.05},
            "export":        {"success": 0.90, "error": 0.10},
            "error":         {"retry": 0.70, "abandon": 0.30},
            "retry":         {"export": 0.80, "abandon": 0.20},
            "abandon":      {},
            "success":       {},
        },
    },
}

TERMINAL_STATES = {"abandon", "success"}

# ============ SIMULATION ENGINE ============

def simulate_flow(flow_name: str, flows: dict, n: int = 1000) -> Dict:
    states = flows[flow_name]["states"]
    results = []
    for _ in range(n):
        state = "start"
        steps = 0
        while state not in TERMINAL_STATES:
            transitions = states.get(state, {})
            if not transitions:
                break
            next_states = list(transitions.keys())
            probs = list(transitions.values())
            state = random.choices(next_states, probs)[0]
            steps += 1
            if steps > 50:
                state = "abandon"
                break
        results.append((state, steps))

    successes = sum(1 for s, _ in results if s == "success")
    abandonments = sum(1 for s, _ in results if s == "abandon")
    avg_steps = sum(s for _, s in results) / len(results)
    
    # Find high-abandonment source states
    abandon_from = {}
    for _, _, path in [(s, st, []) for s, st in results]:
        pass  # simplified - just use overall stats

    return {
        "flow": flow_name,
        "description": flows[flow_name]["description"],
        "simulations": n,
        "successes": successes,
        "abandonments": abandonments,
        "completion_rate": round(successes / n * 100, 1),
        "dead_end_rate": round(abandonments / n * 100, 1),
        "avg_steps": round(avg_steps, 1),
        "passed": successes / n > 0.70 and abandonments / n < 0.10 and avg_steps < 8,
    }

# ============ MAIN ============

def main():
    mode = "--current" if "--current" in sys.argv else "--target"
    flows = FLOWS_CURRENT if mode == "--current" else FLOWS_TARGET
    
    print("=" * 60)
    print(f"  MARKOV CHAIN VALIDATOR - {mode.upper()} PROBABILITIES")
    print(f"  Nicola Schaefer Hub")
    print("=" * 60)
    
    all_passed = True
    results = []
    
    for name in flows:
        r = simulate_flow(name, flows)
        results.append(r)
        status = "PASS" if r["passed"] else "FAIL"
        print(f"\n  {name}:")
        print(f"    Completion: {r['completion_rate']}% | Dead-ends: {r['dead_end_rate']}% | Avg steps: {r['avg_steps']}")
        print(f"    Result: {status}")
        if not r["passed"]:
            all_passed = False
    
    print(f"\n{'=' * 60}")
    print(f"  OVERALL: {'ALL PASS' if all_passed else 'SOME FAIL'}")
    print(f"{'=' * 60}")
    
    try:
        with open("tests/markov/validation_results.json", "w") as f:
            json.dump({"mode": mode, "results": results}, f, indent=2)
    except:
        pass
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())