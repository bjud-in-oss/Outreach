---
name: decomposing-tickets
description: Use when converting a multi-domain or complex prompt brief in PROMPT.md into single-domain building tickets under doc/TICKETS/ and updating doc/TICKETS.md
---

# Decomposing Tickets

## Overview
Decomposes complex requirements into isolated, domain-bound execution tickets adhering to Feature-Sliced Design (FSD) and SI v10.0.

## Output Contract
1. **Ticket Specs (`doc/TICKETS/TCK-XXX.md`):** Create one file per isolated ticket (1 domain per ticket).
2. **Updated Index (`doc/TICKETS.md`):** Append entries formatted as:
   `- [OPEN] TCK-XXX | Domän: src/features/[modul]/ | Mål: [Sammanfattning] | Spec: doc/TICKETS/TCK-XXX.md`

## Rules
- **1 Ticket = 1 Domain:** Never combine two FSD modules in the same ticket.
- **No Source Edits:** Do NOT edit any files under `src/` during decomposition.