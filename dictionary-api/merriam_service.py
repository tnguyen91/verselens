import requests
from typing import Dict, List, Optional
from urllib.parse import quote

class MerriamWebsterService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.dictionaryapi.com/api/v3/references/collegiate/json"
        self.session = requests.Session()
    
    def _construct_audio_url(self, audio_file: str) -> Optional[str]:
        if not audio_file:
            return None
            
        subdir = audio_file[0]
        
        return f"https://media.merriam-webster.com/soundc11/{subdir}/{audio_file}.wav"
    
    def get_pronunciation(self, word: str) -> List[Dict[str, Optional[str]]]:
        if not self.api_key:
            return []
        
        try:
            url = f"{self.base_url}/{quote(word)}?key={self.api_key}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            
            if not data or isinstance(data, list) and all(isinstance(item, str) for item in data):
                return []
            
            return self._extract_pronunciations(data)
            
        except Exception:
            return []
    
    def _extract_pronunciations(self, data: List[Dict]) -> List[Dict[str, Optional[str]]]:
        if not isinstance(data, list) or len(data) == 0:
            return []
        
        pronunciations = []
        
        entry = data[0]
        
        if 'hwi' in entry and 'prs' in entry['hwi']:
            for pr in entry['hwi']['prs']:
                text = pr.get('mw', '')
                
                audio = None
                if 'sound' in pr and 'audio' in pr['sound']:
                    audio_file = pr['sound']['audio']
                    if audio_file:
                        audio = self._construct_audio_url(audio_file)
                
                if text and audio:
                    pronunciations.append({
                        "text": text,
                        "audio": audio
                    })
        
        return pronunciations
