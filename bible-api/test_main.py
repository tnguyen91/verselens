from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "translations_available" in data

def test_get_translations():
    response = client.get("/api/translations")
    assert response.status_code == 200
    data = response.json()
    assert "translations" in data
    assert isinstance(data["translations"], list)

def test_get_books():
    response = client.get("/api/books")
    assert response.status_code == 200
    data = response.json()
    assert "books" in data
    assert isinstance(data["books"], list)

def test_get_chapters_valid():
    response = client.get("/api/Genesis/chapters")
    assert response.status_code == 200
    data = response.json()
    assert "book" in data
    assert "chapters" in data

def test_get_chapters_invalid():
    response = client.get("/api/NotABook/chapters")
    assert response.status_code == 404

def test_get_verses_valid():
    response = client.get("/api/NIV/Genesis/1/verses")
    assert response.status_code == 200
    data = response.json()
    assert "verses" in data

def test_get_verses_invalid():
    response = client.get("/api/NIV/Genesis/999/verses")
    assert response.status_code == 404

def test_get_verses_empty_params():
    response = client.get("/api//Genesis//verses")
    assert response.status_code == 404
