from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
import os
from dotenv import load_dotenv

load_dotenv()

from wordnet_service import WordNetService
from merriam_service import MerriamWebsterService

app = FastAPI(title="Dictionary API", description="A dictionary API using WordNet and Merriam-Webster")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

wordnet_service = WordNetService()
merriam_webster_api_key = os.getenv("MERRIAM_WEBSTER_API_KEY")
merriam_service = MerriamWebsterService(merriam_webster_api_key)

class PhoneticData(BaseModel):
    text: Optional[str] = None
    audio: Optional[str] = None

class DefinitionData(BaseModel):
    wordnet: Optional[List[str]] = None
    easton: Optional[List[str]] = None  # Placeholder 

class WordDefinition(BaseModel):
    word: str
    pronunciation: Optional[Dict[str, List[PhoneticData]]] = None
    definitions: Optional[DefinitionData] = None

@app.get("/")
async def root():
    return {"message": "Dictionary API is running", "endpoints": ["/api/define/{word}", "/health"]}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "wordnet_available": True, 
        "merriam_webster_configured": bool(merriam_webster_api_key and merriam_webster_api_key.strip())
    }

@app.get("/api/define/{word}", response_model=WordDefinition)
async def define_word(word: str):
    try:
        if not word or len(word.strip()) == 0:
            raise HTTPException(status_code=400, detail="Word parameter is required")
        
        clean_word = re.sub(r'[^a-zA-Z]', '', word.lower().strip())
        
        if not clean_word:
            raise HTTPException(status_code=400, detail="Invalid word format")
        
        # WordNet 
        wordnet_definitions = wordnet_service.get_simple_definitions(clean_word)
        
        if not wordnet_definitions:
            raise HTTPException(status_code=404, detail=f"No definitions found for '{word}'")
        
        # Merriam-Webster 
        pronunciations = merriam_service.get_pronunciation(clean_word)
        phonetics = []
        for pronunciation in pronunciations:
            phonetics.append(PhoneticData(
                text=pronunciation.get("text"),
                audio=pronunciation.get("audio")
            ))
        
        # response
        response = WordDefinition(
            word=clean_word,
            pronunciation={"phonetics": phonetics} if phonetics else None,
            definitions=DefinitionData(wordnet=wordnet_definitions)
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing word '{word}': {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run(app, host=host, port=port, reload=False)
