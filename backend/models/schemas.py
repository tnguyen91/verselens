from pydantic import BaseModel

class TextRequest(BaseModel):
    text: str

class WordRequest(BaseModel):
    word: str

class TranslateResponse(BaseModel):
    translated: str

class DefineResponse(BaseModel):
    definition: str
