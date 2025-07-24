from models.schemas import DefineResponse, WordRequest
import nltk
nltk.download('wordnet')
nltk.download('omw-1.4')
from fastapi import APIRouter, HTTPException
from nltk.corpus import wordnet as wn

router = APIRouter()

@router.post("/", response_model=DefineResponse)
async def define_word(payload: WordRequest):
    word = payload.word.lower().strip()
    synsets = wn.synsets(word)

    if not synsets:
        raise HTTPException(status_code=404, detail="No definition found.")

    definition = synsets[0].definition()
    return {"definition": definition}
