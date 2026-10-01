from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Process liveness only; does not contact Firebase or model services."""
    return {"status": "ok", "service": "finance-backend"}
