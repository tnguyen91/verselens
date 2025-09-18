"""
Simplified FastAPI server for semantic search

Clean, minimal API focused on core functionality
"""

import logging
import json
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from embedding_service import SimpleSemanticSearch
from bible_loader import BibleDataLoader

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="VerseLens Semantic Search", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
search_service = SimpleSemanticSearch()
bible_loader = BibleDataLoader()

# Request models
class SearchRequest(BaseModel):
    query: str
    k: Optional[int] = 8

class SearchResponse(BaseModel):
    query: str
    results: List[Dict]
    total: int

@app.get("/health")
def health_check():
    """Simple health check"""
    return {"status": "healthy"}

@app.get("/status")
def get_status():
    """Get service status"""
    return search_service.get_status()

@app.post("/search", response_model=SearchResponse)
def search_verses(request: SearchRequest):
    """
    Search for semantically similar Bible verses
    """
    try:
        if not search_service.ready:
            raise HTTPException(status_code=503, detail="Search index not ready")
        
        # Validate query
        if not request.query or len(request.query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Query too short (minimum 2 characters)")
        
        # Search
        results = search_service.search(request.query, request.k)
        
        # Format response
        return SearchResponse(
            query=request.query,
            results=[r.to_dict() for r in results],
            total=len(results)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@app.post("/build-index")
def build_index(background_tasks: BackgroundTasks, translation: str = "KJV"):
    """
    Build search index from real Bible data (background task)
    """
    def build_task():
        try:
            logger.info(f"Loading Bible data: {translation}")
            bible_data = bible_loader.load_bible_data(translation)
            
            total_verses = sum(
                len(verses) 
                for book in bible_data.values() 
                for verses in book.values()
            )
            
            logger.info(f"Building index with {len(bible_data)} books, {total_verses} verses...")
            search_service.build_index(bible_data)
            logger.info("✅ Index build complete")
            
        except Exception as e:
            logger.error(f"Index build failed: {e}")
    
    if search_service.ready:
        return {"message": "Index already exists", "translation": translation}
    
    background_tasks.add_task(build_task)
    return {"message": f"Index build started for {translation}", "translation": translation}

@app.get("/translations")
def get_translations():
    """
    Get available Bible translations
    """
    return {
        "available": bible_loader.get_available_translations(),
        "cached": bible_loader.list_cached_translations()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)