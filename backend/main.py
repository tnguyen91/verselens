from fastapi import FastAPI
from services.translation import router as translation_router
from services.define import router as define_router

app = FastAPI(title="VerseLens API")

# Include feature routes
app.include_router(translation_router, prefix="/translate")
app.include_router(define_router, prefix="/define")

@app.get("/")
def root():
    return {"message": "VerseLens API is running."}
