import nltk
import os
from nltk.corpus import wordnet as wn
from typing import List, Dict

def ensure_nltk_data():
    if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        nltk.data.path.append('/tmp/nltk_data')
        
    try:
        nltk.data.find('corpora/wordnet')
    except LookupError:
        if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
            nltk.download('wordnet', download_dir='/tmp/nltk_data')
        else:
            nltk.download('wordnet')

    try:
        nltk.data.find('corpora/omw-1.4')
    except LookupError:
        if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
            nltk.download('omw-1.4', download_dir='/tmp/nltk_data')
        else:
            nltk.download('omw-1.4')

class WordNetService:
    def __init__(self):
        ensure_nltk_data()
    
    def get_simple_definitions(self, word: str) -> List[str]:
        definitions = []
        synsets = wn.synsets(word)
        
        pos_map = {
            'n': 'noun',
            'v': 'verb', 
            'a': 'adjective',
            's': 'adjective satellite',
            'r': 'adverb'
        }
        
        for synset in synsets:
            pos = pos_map.get(synset.pos(), synset.pos())
            definition = synset.definition()
            formatted_def = f"{pos}: {definition}"
            
            if formatted_def not in definitions:
                definitions.append(formatted_def)
        
        return definitions
    
    def get_synonyms(self, word: str) -> List[str]:
        synonyms = set()
        synsets = wn.synsets(word)
        
        for synset in synsets:
            for lemma in synset.lemmas():
                synonym = lemma.name().replace('_', ' ')
                if synonym.lower() != word.lower():
                    synonyms.add(synonym)
        
        return list(synonyms)