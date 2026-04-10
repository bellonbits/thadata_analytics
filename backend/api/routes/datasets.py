from fastapi import APIRouter, HTTPException
from api.models import DatasetListItem, DatasetDetail, ColumnStat, DeleteResponse, QueryRequest, QueryResponse
from services.data_processor import (
    list_datasets,
    get_dataset_profile,
    get_column_stats,
    get_preview_json,
    run_query,
    delete_dataset,
    dataset_exists,
)

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("", response_model=list[DatasetListItem])
def get_datasets():
    """List all ingested datasets."""
    return list_datasets()


@router.get("/{dataset_id}", response_model=DatasetDetail)
def get_dataset(dataset_id: str):
    """Full schema, column stats, and data preview for one dataset."""
    if not dataset_exists(dataset_id):
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    try:
        profile  = get_dataset_profile(dataset_id)
        col_stats = get_column_stats(dataset_id)
        preview  = get_preview_json(dataset_id, n=20)
        return DatasetDetail(
            dataset_id=dataset_id,
            filename=profile["filename"],
            row_count=profile["row_count"],
            col_count=profile["col_count"],
            columns=profile["columns"],
            dtypes=profile["dtypes"],
            null_pct=profile["null_pct"],
            duplicate_rows=profile["duplicate_rows"],
            warnings=profile["warnings"],
            column_stats=[ColumnStat(**s) for s in col_stats],
            preview=preview,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{dataset_id}", response_model=DeleteResponse)
def remove_dataset(dataset_id: str):
    """Delete a dataset from memory and disk."""
    deleted = delete_dataset(dataset_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    return DeleteResponse(deleted=True, dataset_id=dataset_id)


@router.post("/query", response_model=QueryResponse)
def query_dataset(req: QueryRequest):
    """Run a SQL query against a dataset using DuckDB. Use 'dataset' as the table name."""
    if not dataset_exists(req.dataset_id):
        raise HTTPException(status_code=404, detail=f"Dataset '{req.dataset_id}' not found")
    try:
        result = run_query(req.dataset_id, req.sql)
        return QueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query failed: {str(e)}")
