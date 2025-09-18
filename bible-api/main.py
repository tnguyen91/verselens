from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from mangum import Mangum

from bible_loader import BibleDataLoader

app = FastAPI(title="Bible API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

bible_loader = BibleDataLoader()

class TranslationsResponse(BaseModel):
    available: List[str]
    cached: List[str]
    total: int

class BibleResponse(BaseModel):
    translation: str
    translation_name: str
    books: List[str]
    total_verses: int
    data: Dict[str, Any]

class BookResponse(BaseModel):
    translation: str
    book: str
    chapters: List[str]
    data: Dict[str, Any]

class ChapterResponse(BaseModel):
    translation: str
    book: str
    chapter: int
    verses: Dict[str, str]
    verse_count: int

@app.get("/")
async def root():
    return {
        "message": "Bible API is running", 
        "endpoints": [
            "/health",
            "/api/translations", 
            "/api/{translation}", 
            "/api/{translation}/{book}",
            "/api/{translation}/{book}/{chapter}"
        ],
    }

@app.get("/health")
async def health_check():
    available_translations = bible_loader.get_available_translations()
    cached_translations = bible_loader.list_cached_translations()
    
    return {
        "status": "healthy",
        "translations_available": len(available_translations) > 0,
        "cached_translations": len(cached_translations)
    }

@app.get("/api/translations", response_model=TranslationsResponse)
async def get_all_translations():
    try:
        available = bible_loader.get_available_translations()
        cached = bible_loader.list_cached_translations()
        
        return TranslationsResponse(
            available=available,
            cached=cached,
            total=len(available)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching translations: {str(e)}")

@app.get("/api/{translation}", response_model=BibleResponse)
async def get_specific_translation(translation: str):
    try:
        bible_data = bible_loader.load_bible_data(translation)
        
        total_verses = sum(
            len(chapter) for book in bible_data.values() 
            for chapter in book.values()
        )
        
        return BibleResponse(
            translation=translation,
            translation_name=translation.upper(),
            books=list(bible_data.keys()),
            total_verses=total_verses,
            data=bible_data
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading {translation}: {str(e)}")

@app.get("/api/{translation}/{book}", response_model=BookResponse)
async def get_book(translation: str, book: str):
    try:
        bible_data = bible_loader.load_bible_data(translation)
        
        book_data = None
        actual_book_name = None
        for book_name in bible_data.keys():
            if book_name.lower() == book.lower():
                book_data = bible_data[book_name]
                actual_book_name = book_name
                break
        
        if book_data is None:
            available_books = list(bible_data.keys())
            raise HTTPException(
                status_code=404, 
                detail=f"Book '{book}' not found. Available books: {available_books[:10]}..."
            )
        
        return BookResponse(
            translation=translation,
            book=actual_book_name,
            chapters=list(book_data.keys()),
            data={actual_book_name: book_data}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading book {book}: {str(e)}")

@app.get("/api/{translation}/{book}/{chapter}", response_model=ChapterResponse)
async def get_chapter(translation: str, book: str, chapter: int):
    try:
        bible_data = bible_loader.load_bible_data(translation)
        
        book_data = None
        actual_book_name = None
        for book_name in bible_data.keys():
            if book_name.lower() == book.lower():
                book_data = bible_data[book_name]
                actual_book_name = book_name
                break
        
        if book_data is None:
            raise HTTPException(status_code=404, detail=f"Book '{book}' not found")
        
        chapter_str = str(chapter)
        if chapter_str not in book_data:
            available_chapters = list(book_data.keys())
            raise HTTPException(
                status_code=404,
                detail=f"Chapter {chapter} not found in {book}. Available: {available_chapters}"
            )
        
        chapter_data = book_data[chapter_str]
        
        return ChapterResponse(
            translation=translation,
            book=actual_book_name,
            chapter=chapter,
            verses=chapter_data,
            verse_count=len(chapter_data)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading {book} chapter {chapter}: {str(e)}")

# AWS Lambda handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)