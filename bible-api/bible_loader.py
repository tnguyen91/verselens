import os
import json
import requests
from typing import Dict, Optional, List
from pathlib import Path

class BibleDataLoader:
    def __init__(self, data_dir: str = "data"):
        if os.path.exists("/tmp"):
            self.data_dir = "/tmp/bible_data"
        else:
            self.data_dir = data_dir
            
        self.github_raw_url = "https://raw.githubusercontent.com/jadenzaleski/BibleTranslations/master"
        self.github_api_url = "https://api.github.com/repos/jadenzaleski/BibleTranslations/contents"
        
        self._translations_cache = None
        
        os.makedirs(self.data_dir, exist_ok=True)
    
    def get_available_translations(self) -> List[str]:
        if self._translations_cache is not None:
            return self._translations_cache.copy()
        
        try:
            response = requests.get(self.github_api_url, timeout=10)
            response.raise_for_status()
            
            contents = response.json()
            translations = []
            
            for item in contents:
                if item['type'] == 'dir' and not item['name'].startswith('.') and item['name'] not in ['LICENSE', 'README.md']:
                    translation_code = item['name']
                    translations.append(translation_code)
            
            translations.sort() 
            self._translations_cache = translations
            return translations.copy()
            
        except Exception as e:
            return []
    
    def load_bible_data(self, translation: str = "ESV") -> Dict:
        translation = translation.upper()
        
        available_translations = self.get_available_translations()
        if translation not in available_translations:
            raise ValueError(f"Unsupported translation: {translation}. Available: {available_translations}")
        
        local_path = os.path.join(self.data_dir, f"{translation}.json")
        if os.path.exists(local_path):
            return self._load_from_file(local_path)
        
        try:
            return self._download_from_github(translation)
        except Exception as e:
            raise Exception(f"Unable to load Bible data for {translation}. Please check the translation name and network connection.")
    
    def _load_from_file(self, file_path: str) -> Dict:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
            return self._normalize_bible_data(raw_data)
        except Exception as e:
            raise
    
    def _download_from_github(self, translation: str) -> Dict:
        url = f"{self.github_raw_url}/{translation}/{translation}_bible.json"
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            raw_data = response.json()
            
            local_path = os.path.join(self.data_dir, f"{translation}.json")
            with open(local_path, 'w', encoding='utf-8') as f:
                json.dump(raw_data, f, indent=2, ensure_ascii=False)
            
            return self._normalize_bible_data(raw_data)
            
        except requests.RequestException as e:
            raise
        except json.JSONDecodeError as e:
            raise
        except Exception as e:
            raise
    
    def _normalize_bible_data(self, raw_data: Dict) -> Dict:
        try:
            if isinstance(raw_data, dict):
                first_book_key = next(iter(raw_data.keys()))
                first_book = raw_data[first_book_key]
                
                if isinstance(first_book, dict):
                    first_chapter_key = next(iter(first_book.keys()))
                    first_chapter = first_book[first_chapter_key]
                    
                    if isinstance(first_chapter, dict):
                        return raw_data
            
            normalized = {}
            
            if isinstance(raw_data, dict):
                for book_name, book_data in raw_data.items():
                    if isinstance(book_data, dict):
                        normalized[book_name] = {}
                        for chapter_key, chapter_data in book_data.items():
                            chapter_num = str(chapter_key)
                            if isinstance(chapter_data, dict):
                                normalized[book_name][chapter_num] = {}
                                for verse_key, verse_text in chapter_data.items():
                                    verse_num = str(verse_key)
                                    normalized[book_name][chapter_num][verse_num] = str(verse_text)
            
            return normalized
            
        except (KeyError, TypeError) as e:
            raise ValueError(f"Invalid Bible data format: {e}")
    
    def get_translation_info(self, translation: str) -> str:
        available_translations = self.get_available_translations()
        return translation if translation in available_translations else translation
    
    def list_cached_translations(self) -> list:
        cached = []
        for file_path in Path(self.data_dir).glob("*.json"):
            translation = file_path.stem.upper()
            if translation != "VERSES_META":
                cached.append(translation)
        return sorted(cached)