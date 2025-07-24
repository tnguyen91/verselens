from fastapi import APIRouter
from transformers import pipeline
from models.schemas import TranslateResponse, WordRequest

router = APIRouter()
translator = pipeline("translation_en_to_es", model="Helsinki-NLP/opus-mt-en-es")

@router.post("/", response_model=TranslateResponse)
async def translate_text(payload: WordRequest):
    result = translator(payload.word)
    return {"translated": result[0]["translation_text"]}