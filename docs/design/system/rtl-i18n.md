# RTL & I18N Guidance (EN / UR / AR)

## Locale Directions
- EN: LTR (`dir="ltr"`)
- UR: RTL (`dir="rtl"`)
- AR: RTL (`dir="rtl"`)

## Use Logical Properties
- `margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `text-align: start/end`

## Mirroring
Mirror: sidebars, drawers, breadcrumbs, chevrons, pagination arrows, trailing/leading icon positions.
Do not mirror: logos, certain domain-specific chart semantics, fixed-order identifiers where required.

## Typography
- EN: `fontFamily.sansLatin`
- UR: `fontFamily.sansUrdu`
- AR: `fontFamily.sansArabic`

## Localization
- Externalize full phrases, no string concatenation
- Stable keys like `checkout.complete_sale`
- Allow 30–40% expansion space

## Practical Example
```tsx
const isRTL = ['ur','ar'].includes(locale)
<AppShell dir={isRTL ? 'rtl' : 'ltr'} />
```
