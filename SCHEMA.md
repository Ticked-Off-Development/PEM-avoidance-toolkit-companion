# Data Schema

This document describes the day record schema used by the PEM Avoidance Toolkit Companion app.

## Schema Versions

### Version 0 (Legacy)

Pre-existing records created before Quick Log mode was added. These records do not contain `schemaVersion` or `entryMode` fields. At read time, `applyDefaults()` fills missing fields automatically.

### Version 1 (Current)

Records created with Quick Log or Full Log mode. Includes `schemaVersion: 1` and `entryMode` field.

## Day Record Fields

| Field | Type | Default (via applyDefaults) | Notes |
|-------|------|----------------------------|-------|
| `id` | `string` | — | Format: `"day-YYYY-MM-DD"` |
| `date` | `string` | — | Format: `"YYYY-MM-DD"` |
| `schemaVersion` | `number` | `0` | `0` for legacy, `1` for current |
| `entryMode` | `string` | `"full"` | `"quick"` or `"full"` |
| `physical` | `string \| null` | `""` | 0-10 activity. `null` in Quick Log entries. |
| `mental` | `string \| null` | `""` | 0-10 activity. `null` in Quick Log entries. |
| `emotional` | `string \| null` | `""` | 0-10 activity. `null` in Quick Log entries. |
| `overall_activity` | `string` | `""` | 0-10. Always present in both modes. |
| `overrideActivity` | `boolean` | `false` | `true` if user manually set overall activity |
| `unrefreshing_sleep` | `boolean \| null` | `null` | `true` = unrefreshing, `false` = refreshing |
| `fatigue` | `object \| null` | `{ am: "", mid: "", pm: "" }` | `null` in Quick Log entries |
| `pain` | `object \| null` | `{ am: "", mid: "", pm: "" }` | `null` in Quick Log entries |
| `nausea_gi` | `object \| null` | `{ am: "", mid: "", pm: "" }` | `null` in Quick Log entries |
| `brain_fog` | `object \| null` | `{ am: "", mid: "", pm: "" }` | `null` in Quick Log entries |
| `other_symptom` | `object \| null` | `{ name: "", am: "", mid: "", pm: "" }` | `null` in Quick Log entries |
| `overall_symptom` | `object` | `{ am: "", mid: "", pm: "" }` | Always present. Quick Log stores same value in all periods. |
| `overrideSymptom` | `boolean` | `false` | `true` if user manually set overall symptom |
| `crash` | `boolean \| null` | `null` | `true` = crash day, `false` = no crash |
| `comments` | `string` | `""` | Free-text notes |

## Entry Mode Differences

### Full Log (`entryMode: "full"`)

All fields are populated. `overall_activity` and `overall_symptom` are auto-calculated from individual dimensions unless overridden.

### Quick Log (`entryMode: "quick"`)

Only 4 core fields are user-entered:
- `overall_activity` (direct entry, `overrideActivity: true`)
- `overall_symptom` (single value stored in all three periods, `overrideSymptom: true`)
- `crash`
- `unrefreshing_sleep`

Individual dimension fields (`physical`, `mental`, `emotional`, `fatigue`, `pain`, `nausea_gi`, `brain_fog`, `other_symptom`) are set to `null`.

## applyDefaults()

Located in `src/utils.js`. This function is the single entry point for normalizing records at read time. It fills any missing fields with their defaults without modifying the stored data. Applied when:

- Loading data from IndexedDB on app start
- Importing backup files
- Opening a record in the day editor

No migration logic exists — all normalization happens at read time.
