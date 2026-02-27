# Design Principles

## 1) Fast by Default
POS workflows should minimize taps, context switching, and cognitive load.

## 2) Clarity over Cleverness
Prefer explicit labels and familiar patterns over novelty.

## 3) Safe Transactions
Highlight irreversible actions and provide clear confirmation states.

## 4) Consistent Across Devices
Token-driven visuals should scale across cashier and back-office contexts.

## 5) Inclusive & Localized
Support EN/UR/AR from day one with accessibility and RTL parity.

## Practical Example
Checkout action hierarchy:
- Primary: `Complete Sale`
- Secondary: `Hold`
- Destructive tertiary: `Clear Cart`
