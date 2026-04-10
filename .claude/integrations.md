# Data Integrations

## Supported Sources

### CSV
- Auto-detect delimiter (comma, semicolon, tab, pipe)
- Infer column data types on load
- Flag columns with > 15% null values
- Normalize column names (snake_case, lowercase)
- Report row count, column count, and null summary on ingest

### Excel (.xlsx)
- Support multi-sheet workbooks
- Default to first sheet unless specified
- Detect merged cells and header rows
- Normalize column names across sheets when joining
- Flag date columns stored as strings

### PostgreSQL / MySQL
- Infer schema from information_schema when not provided
- Generate optimized queries (avoid SELECT *, use indexed columns in WHERE)
- Use parameterized queries — never raw string interpolation
- Report query execution plan on complex queries
- Warn on full table scans over 1M rows

### MongoDB
- Use aggregation pipelines (not find + in-memory filter)
- Project only required fields
- Use $match early in pipeline to filter before $group or $lookup
- Warn on unindexed field queries in $match

### REST APIs (JSON)
- Validate response schema before analysis
- Handle pagination automatically
- Cache responses for repeated queries within same session
- Flag rate limit headers and slow down if needed

---

## Behavior Rules

- **Never assume schema** — always validate or ask
- **Never modify source data** — work on copies
- **Always report data quality** at ingest: row count, null %, type mismatches, duplicates
- **Ask if schema is unclear** before proceeding with analysis
- **Join datasets** only when a clear key relationship exists — validate cardinality before joining

---

## Data Quality Checklist (run on every ingest)

| Check | Action if Failed |
|---|---|
| Null % > 15% in key column | Warn + ask for guidance |
| Duplicate rows detected | Report count + ask to deduplicate |
| Date column has mixed formats | Normalize or flag |
| Numeric column has string values | Flag and attempt coercion |
| ID columns have non-unique values | Alert — may affect join integrity |
