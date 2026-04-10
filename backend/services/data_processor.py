"""
Data processor — handles CSV, Excel, and in-memory DataFrames.
Produces schema info, statistics summaries, and sample rows
for injection into Groq prompts.
"""
from __future__ import annotations

import io
import json
import math
import os
import uuid
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy import create_engine

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
DATA_DIR = Path(os.getenv("DATA_DIR", "data"))

# In-memory dataset registry for the session
_datasets: dict[str, dict[str, Any]] = {}


# ─── Ingestion ────────────────────────────────────────────────────────────────

def ingest_file(file_bytes: bytes, filename: str) -> dict[str, Any]:
    """Load CSV or Excel file into a DataFrame, store it, return profile."""
    ext = Path(filename).suffix.lower()
    if ext == ".csv":
        df = _load_csv(file_bytes)
    elif ext in (".xlsx", ".xls"):
        df = _load_excel(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Use .csv or .xlsx")
    
    return _ingest_dataframe(df, filename)

def ingest_database(db_url: str, query: str, name: str) -> dict[str, Any]:
    """Execute a query against a DB URL and ingest the result."""
    if not db_url or "://" not in db_url:
        raise ValueError("Invalid database URL. Must be in the form: dialect+driver://user:pass@host/db")
    try:
        engine = create_engine(db_url, connect_args={"connect_timeout": 10})
        with engine.connect() as conn:
            df = pd.read_sql(query, conn)
        df = _normalize(df)
        return _ingest_dataframe(df, name or "db_dataset")
    except ImportError as e:
        pkg = str(e).split("'")[-2] if "'" in str(e) else str(e)
        raise ValueError(f"Missing database driver: {pkg}. Install it with: pip install {pkg}")
    except Exception as e:
        msg = str(e)
        if "could not connect" in msg.lower() or "connection refused" in msg.lower():
            raise ValueError(f"Could not connect to database. Check host, port, and credentials.")
        if "password authentication" in msg.lower() or "access denied" in msg.lower():
            raise ValueError("Authentication failed. Check username and password.")
        if "does not exist" in msg.lower() or "unknown database" in msg.lower():
            raise ValueError("Database not found. Check the database name in the URL.")
        raise ValueError(f"Database error: {msg}")

def _ingest_dataframe(df: pd.DataFrame, filename: str) -> dict[str, Any]:
    """Core logic to profile, register, and format a prepared dataframe."""
    dataset_id = str(uuid.uuid4())[:8]
    profile = _profile(df, filename)

    _datasets[dataset_id] = {
        "id": dataset_id,
        "name": filename,
        "df": df,
        "profile": profile,
    }

    # Persist to parquet for durability
    DATA_DIR.mkdir(exist_ok=True)
    df.to_parquet(DATA_DIR / f"{dataset_id}.parquet", index=False)

    return {"dataset_id": dataset_id, **profile}

def ingest_csv_string(csv_string: str, name: str = "inline") -> dict[str, Any]:
    """Ingest inline CSV text."""
    return ingest_file(csv_string.encode(), f"{name}.csv")


def _load_csv(file_bytes: bytes) -> pd.DataFrame:
    for sep in [",", ";", "\t", "|"]:
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), sep=sep, low_memory=False)
            if len(df.columns) > 1:
                return _normalize(df)
        except Exception:
            continue
    raise ValueError("Could not parse CSV — check delimiter and encoding")


def _load_excel(file_bytes: bytes) -> pd.DataFrame:
    df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=0)
    return _normalize(df)


def _normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names and coerce obvious types."""
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(r"[^a-z0-9_]", "_", regex=True)
        .str.replace(r"_+", "_", regex=True)
        .str.strip("_")
    )
    # Deduplicate column names
    seen: dict[str, int] = {}
    new_cols = []
    for c in df.columns:
        if c in seen:
            seen[c] += 1
            new_cols.append(f"{c}_{seen[c]}")
        else:
            seen[c] = 0
            new_cols.append(c)
    df.columns = new_cols

    # Auto-parse dates
    for col in df.columns:
        if any(kw in col for kw in ["date", "time", "day", "month", "year"]):
            try:
                df[col] = pd.to_datetime(df[col], errors="coerce")
            except Exception:
                pass

    return df


# ─── Profiling ────────────────────────────────────────────────────────────────

def _profile(df: pd.DataFrame, filename: str) -> dict[str, Any]:
    """Generate a data quality profile."""
    rows, cols = df.shape
    null_pct = (df.isnull().sum() / rows * 100).round(2).to_dict()
    dup_rows = int(df.duplicated().sum())

    col_types = {col: str(dtype) for col, dtype in df.dtypes.items()}

    warnings = []
    for col, pct in null_pct.items():
        if pct > 15:
            warnings.append(f"Column '{col}' has {pct:.1f}% null values")
    if dup_rows > 0:
        warnings.append(f"{dup_rows} duplicate rows detected")

    return {
        "filename": filename,
        "row_count": rows,
        "col_count": cols,
        "columns": list(df.columns),
        "dtypes": col_types,
        "null_pct": null_pct,
        "duplicate_rows": dup_rows,
        "warnings": warnings,
    }


# ─── Summary for prompts ──────────────────────────────────────────────────────

def get_schema_info(dataset_id: str) -> str:
    df = _get_df(dataset_id)
    lines = ["| Column | Type | Null% | Sample Values |", "|--------|------|-------|---------------|"]
    rows = len(df)
    for col in df.columns:
        dtype = str(df[col].dtype)
        null_pct = f"{df[col].isnull().mean() * 100:.1f}%"
        sample = df[col].dropna().head(3).tolist()
        sample_str = ", ".join(str(v) for v in sample)
        lines.append(f"| {col} | {dtype} | {null_pct} | {sample_str} |")
    return "\n".join(lines)


def get_data_summary(dataset_id: str) -> str:
    df = _get_df(dataset_id)
    parts = [f"Total rows: {len(df):,} | Total columns: {len(df.columns)}"]

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    date_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()

    if date_cols:
        for col in date_cols[:2]:
            mn = df[col].min()
            mx = df[col].max()
            parts.append(f"Date range ({col}): {mn} → {mx}")

    if numeric_cols:
        desc = df[numeric_cols].describe().round(2)
        parts.append("\nNumeric column statistics:")
        parts.append(desc.to_string())

    # Top categorical values
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    for col in cat_cols[:3]:
        top = df[col].value_counts().head(5)
        parts.append(f"\nTop values in '{col}':\n{top.to_string()}")

    return "\n".join(parts)


def get_sample_rows(dataset_id: str, n: int = 10) -> str:
    df = _get_df(dataset_id)
    return df.head(n).to_markdown(index=False)


def get_chart_data(dataset_id: str, x_col: str, y_col: str, limit: int = 50) -> list[dict]:
    """Extract chart-ready data for a given x/y column pair."""
    df = _get_df(dataset_id)
    if x_col not in df.columns or y_col not in df.columns:
        return []
    subset = df[[x_col, y_col]].dropna().head(limit)
    return [
        {x_col: _safe_val(row[x_col]), y_col: _safe_val(row[y_col])}
        for _, row in subset.iterrows()
    ]


def run_query(dataset_id: str, sql: str) -> dict[str, Any]:
    """Run a SQL query against a dataset using DuckDB."""
    import duckdb
    df = _get_df(dataset_id)
    con = duckdb.connect()
    con.register("dataset", df)
    # Replace table name aliases
    clean_sql = sql.replace("{dataset}", "dataset").replace("{table}", "dataset")
    result = con.execute(clean_sql).df()
    return {
        "columns": list(result.columns),
        "rows": result.head(1000).to_dict(orient="records"),
        "row_count": len(result),
    }


# ─── Registry ─────────────────────────────────────────────────────────────────

def list_datasets() -> list[dict[str, Any]]:
    result = []
    for ds_id, ds in _datasets.items():
        p = ds["profile"]
        result.append({
            "dataset_id": ds_id,
            "name": p["filename"],
            "rows": p["row_count"],
            "columns": p["col_count"],
            "warnings": p["warnings"],
        })
    return result


def get_dataset_profile(dataset_id: str) -> dict[str, Any]:
    if dataset_id not in _datasets:
        # Try loading from disk
        _try_load_from_disk(dataset_id)
    return _datasets[dataset_id]["profile"]


def dataset_exists(dataset_id: str) -> bool:
    if dataset_id in _datasets:
        return True
    parquet = DATA_DIR / f"{dataset_id}.parquet"
    return parquet.exists()


def _get_df(dataset_id: str) -> pd.DataFrame:
    if dataset_id not in _datasets:
        _try_load_from_disk(dataset_id)
    return _datasets[dataset_id]["df"]


def _try_load_from_disk(dataset_id: str) -> None:
    parquet = DATA_DIR / f"{dataset_id}.parquet"
    if not parquet.exists():
        raise KeyError(f"Dataset '{dataset_id}' not found")
    df = pd.read_parquet(parquet)
    _datasets[dataset_id] = {
        "id": dataset_id,
        "name": f"{dataset_id}.parquet",
        "df": df,
        "profile": _profile(df, f"{dataset_id}.parquet"),
    }


def get_preview_json(dataset_id: str, n: int = 20) -> list[dict[str, Any]]:
    """Return first n rows as JSON-serialisable list of dicts."""
    df = _get_df(dataset_id)
    return [
        {col: _safe_val(val) for col, val in row.items()}
        for row in df.head(n).to_dict(orient="records")
    ]


def get_column_stats(dataset_id: str) -> list[dict[str, Any]]:
    """
    Per-column statistics for the schema inspector UI.
    Returns list of dicts with: name, dtype, null_pct, unique, min, max,
    mean, sample_values, is_numeric, is_date, quality.
    """
    df = _get_df(dataset_id)
    rows = len(df)
    stats = []

    for col in df.columns:
        series = df[col]
        null_pct = round(series.isnull().mean() * 100, 1)
        unique = int(series.nunique())
        dtype = str(series.dtype)
        is_numeric = pd.api.types.is_numeric_dtype(series)
        is_date = pd.api.types.is_datetime64_any_dtype(series)

        sample = [_safe_val(v) for v in series.dropna().head(3).tolist()]

        entry: dict[str, Any] = {
            "name": col,
            "dtype": dtype,
            "null_pct": null_pct,
            "unique": unique,
            "unique_pct": round(unique / rows * 100, 1) if rows else 0,
            "is_numeric": is_numeric,
            "is_date": is_date,
            "sample_values": sample,
            "min": None,
            "max": None,
            "mean": None,
        }

        if is_numeric:
            entry["min"]  = _safe_val(series.min())
            entry["max"]  = _safe_val(series.max())
            entry["mean"] = round(float(series.mean()), 2) if not series.isna().all() else None
        elif is_date:
            entry["min"] = _safe_val(series.min())
            entry["max"] = _safe_val(series.max())

        # Quality score 0–100: penalise nulls, reward uniqueness for IDs
        quality = max(0, 100 - int(null_pct * 1.5))
        entry["quality"] = quality

        stats.append(entry)

    return stats


def delete_dataset(dataset_id: str) -> bool:
    """Remove a dataset from memory and disk. Returns True if found."""
    found = False
    if dataset_id in _datasets:
        del _datasets[dataset_id]
        found = True
    parquet = DATA_DIR / f"{dataset_id}.parquet"
    if parquet.exists():
        parquet.unlink()
        found = True
    return found


def get_numeric_series(dataset_id: str, col: str, limit: int = 200) -> list[dict[str, Any]]:
    """Return a single numeric column as [{index, value}] for a histogram."""
    df = _get_df(dataset_id)
    if col not in df.columns:
        return []
    series = df[col].dropna().head(limit)
    return [{"index": i, "value": _safe_val(v)} for i, v in enumerate(series)]


def _safe_val(v: Any) -> Any:
    if isinstance(v, float) and math.isnan(v):
        return None
    if hasattr(v, "item"):
        return v.item()
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return v
