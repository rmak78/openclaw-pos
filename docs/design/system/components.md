# Core Components Specification

## Buttons
- Variants: primary, secondary, danger, ghost
- Sizes: sm (32), md (40), lg (48)
- States: default, hover, pressed, disabled, loading
- Rule: icon-only buttons must include `aria-label`

Example:
```tsx
<Button variant="primary" size="md">Complete Sale</Button>
```

## Inputs
- Types: text, number/currency, search, select, textarea
- States: default, focus, error, disabled, readonly
- Rules: visible labels, helper/error linkage via `aria-describedby`

## Tables
- Use for product/inventory/sales grids
- Rules: sticky header for long lists, right-align numeric columns

## Badges
- Tones: success, warning, error, info, neutral
- Rule: include text; never rely on color only

## Modals
- Types: confirmation, form, alert
- Rules: focus trap, ESC close, danger style for destructive confirms

## Navigation
- Pattern: top bar + sidebar (desktop), optional bottom nav (mobile)
- Rules: active item with `aria-current`, concise labels

## Naming Conventions
- Base: `Component`
- Variant: `Component--variant`
- Size: `Component--size`
- State: `is-state`
