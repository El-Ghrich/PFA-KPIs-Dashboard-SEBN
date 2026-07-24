from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_feature_data():
    return {"message": "Feature A is successfully wired up!"}