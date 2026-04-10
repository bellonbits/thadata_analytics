from fastapi import APIRouter, File, UploadFile, HTTPException
from api.models import IngestResponse, DBIngestRequest
from services.data_processor import ingest_file, ingest_database

router = APIRouter(prefix="/ingest", tags=["Ingest"])

MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


@router.post("", response_model=IngestResponse)
async def ingest(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file.
    Returns dataset_id + quality profile for use in /analyze.
    """
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload .csv or .xlsx",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is 50 MB.",
        )

    try:
        result = ingest_file(contents, filename)
        return IngestResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.post("/db", response_model=IngestResponse)
def ingest_db(request: DBIngestRequest):
    """
    Connect to arbitrary DB via URL string and ingest data.
    """
    try:
        result = ingest_database(request.db_url, request.query, request.name)
        return IngestResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB Ingestion failed: {str(e)}")
