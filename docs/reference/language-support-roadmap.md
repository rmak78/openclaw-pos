# Language Support Roadmap

## Active language set (Phase 1)

- English (`en`) — default
- Arabic (`ar`) — RTL
- German (`de`)
- French (`fr`)
- Urdu (`ur`) — RTL

## Design rules for future expansion

1. **Locale-first architecture**
   - All UI labels, errors, reports, and printable templates must use translation keys.
   - No user-facing hardcoded strings in business components.

2. **BCP-47 locale strategy**
   - Base: `en`, `ar`, `de`, `fr`, `ur`
   - Regional variants later: `en-GB`, `fr-CA`, `ar-AE`, `ur-PK`, etc.

3. **RTL/LTR compatibility by default**
   - Use logical CSS properties (`margin-inline-start`, `padding-inline-end`, etc.)
   - Layout mirrors for `ar` and `ur`
   - PDF/print templates must support RTL rendering.

4. **Fallback chain**
   - `requested locale -> base language -> en`
   - Missing key telemetry must be tracked in logs.

5. **Translation namespace model**
   - `common`
   - `pos`
   - `backoffice`
   - `reports`
   - `hr-payroll`
   - `legal-templates`
   - `errors`

6. **Formatting service (shared)**
   - Date/time: locale + timezone aware
   - Number/currency: locale aware with operational currency
   - Parsing/validation rules per locale for inputs

7. **Content governance**
   - Source language: English
   - Versioned glossary and term freeze per release
   - Legal text reviews required before production use in each country

## Minimum implementation artifacts

- `i18n/config.ts` (supported locales, defaults, fallback)
- `i18n/namespaces/*.json` per locale
- RTL-aware UI test suite
- Localization QA checklist for UI + reports + print templates

## Future language onboarding checklist

When adding a new language:

1. Add locale to config and fallback map
2. Generate namespace skeletons
3. Translate core flows (login, sale, payment, shift open/close, errors)
4. Validate number/date/currency formatting
5. Validate PDF/print output
6. Run accessibility and bidi tests (if RTL)
7. Publish glossary updates

## Current requirement lock

The project is now locked to support:

- English
- Arabic
- German
- French
- Urdu

with architecture ready for additional languages without major refactor.
