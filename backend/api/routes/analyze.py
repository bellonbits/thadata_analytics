from fastapi import APIRouter, HTTPException
from api.models import AnalyzeRequest, AnalyzeResponse, QuickQuestionRequest
from services.analysis_engine import run_analysis, run_quick_question

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """
    Main analysis endpoint.
    Accepts a structured problem + dataset reference, returns a full analysis.
    """
    try:
        result = await run_analysis(
            mode=req.output,
            problem=req.problem,
            context=req.context.model_dump(),
            objective=req.objective,
            constraints=req.constraints,
            parameters=req.parameters.model_dump(),
            dataset_id=req.dataset_id,
            inline_data=req.inline_data,
        )
        return AnalyzeResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/quick", response_model=AnalyzeResponse)
async def quick_question(req: QuickQuestionRequest):
    """Lightweight Q&A endpoint for quick dataset questions."""
    try:
        result = await run_quick_question(
            question=req.question,
            dataset_id=req.dataset_id,
        )
        return AnalyzeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick analysis failed: {str(e)}")
