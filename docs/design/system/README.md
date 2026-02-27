# OpenClaw POS Design System (v0.1)

This directory contains the initial design system baseline for the OpenClaw POS product.

## Scope
- Design principles
- Core design tokens (color, typography, spacing)
- Component specifications for key UI building blocks
- Accessibility baseline (WCAG-aligned)
- RTL and localization guidance for English (EN), Urdu (UR), and Arabic (AR)
- Naming conventions and practical usage patterns

## File Map
- `principles.md` — product-facing design principles
- `tokens/colors.json` — semantic color tokens
- `tokens/typography.json` — type scale and font tokens
- `tokens/spacing.json` — spacing, radius, and elevation primitives
- `components.md` — specs for buttons, inputs, tables, badges, modals, and navigation
- `accessibility.md` — WCAG targets and implementation checklist
- `rtl-i18n.md` — bidi/RTL, localization and EN/UR/AR rules

## Naming Conventions
- Color: `color.{role}.{state}` (e.g. `color.action.primary.default`)
- Typography: `type.{category}.{size}` (e.g. `type.body.md`)
- Spacing: `space.{step}` (e.g. `space.4`)
- Radius: `radius.{size}` (e.g. `radius.md`)
- Shadows: `shadow.{level}` (e.g. `shadow.2`)

## Practical Usage Example
```ts
const ButtonPrimary = {
  backgroundColor: tokens.color.action.primary.default,
  color: tokens.color.action.primary.text,
  borderRadius: tokens.radius.md,
  paddingInline: tokens.space[4],
  paddingBlock: tokens.space[2],
  font: tokens.type.label.md,
}
```
