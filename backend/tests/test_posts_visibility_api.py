from fastapi.testclient import TestClient

from app.deps import CurrentUser, get_current_user, get_current_user_optional
from app.main import app
from app.schemas.posts import PostCreate

client = TestClient(app)

PRIVATE_POST = {
    "post_id": 1,
    "titel": "Privat post",
    "innehall": "Bara för ägaren.",
    "synlighet": "privat",
    "skapad_datum": "2026-03-15T12:00:00",
    "anvandar": {"anvandar_id": 7, "anvandarnamn": "Alice"},
    "kategori": {"kategori_id": 1, "namn": "Reflektion"},
}

PUBLIC_POST = {
    "post_id": 2,
    "titel": "Publik post",
    "innehall": "Synlig i Utforska.",
    "synlighet": "publik",
    "skapad_datum": "2026-03-15T12:00:00",
    "anvandar": {"anvandar_id": 7, "anvandarnamn": "Alice"},
    "kategori": {"kategori_id": 1, "namn": "Reflektion"},
}


def _override_optional(user: CurrentUser | None):
    def _dep():
        return user

    return _dep


def _override_required(user: CurrentUser):
    def _dep():
        return user

    return _dep


def test_post_create_defaults_to_private():
    payload = PostCreate(kategori_id=1, titel="Titel", innehall="Innehåll")
    assert payload.synlighet == "privat"


def test_private_post_hidden_from_other_user(monkeypatch):
    monkeypatch.setattr("app.routers.posts.post_repo.get_post_by_id", lambda post_id: PRIVATE_POST)
    app.dependency_overrides[get_current_user_optional] = _override_optional(CurrentUser(anvandar_id=8, ar_admin=False))
    try:
        response = client.get("/api/posts/1")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 404


def test_private_post_visible_to_owner(monkeypatch):
    monkeypatch.setattr("app.routers.posts.post_repo.get_post_by_id", lambda post_id: PRIVATE_POST)
    app.dependency_overrides[get_current_user_optional] = _override_optional(CurrentUser(anvandar_id=7, ar_admin=False))
    try:
        response = client.get("/api/posts/1")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["synlighet"] == "privat"


def test_public_route_only_returns_public_posts(monkeypatch):
    monkeypatch.setattr(
        "app.routers.posts.post_repo.get_public_post_by_id",
        lambda post_id: PUBLIC_POST if post_id == 2 else None,
    )
    response = client.get("/api/posts/public/2")
    assert response.status_code == 200
    assert response.json()["synlighet"] == "publik"

    missing = client.get("/api/posts/public/1")
    assert missing.status_code == 404


def test_list_posts_filters_to_current_user_for_non_admin(monkeypatch):
    calls: list[tuple[int | None, str | None]] = []

    def _fake_get_all_posts(anvandar_id=None, synlighet=None):
        calls.append((anvandar_id, synlighet))
        return [PRIVATE_POST, PUBLIC_POST]

    monkeypatch.setattr("app.routers.posts.post_repo.get_all_posts", _fake_get_all_posts)
    app.dependency_overrides[get_current_user] = _override_required(CurrentUser(anvandar_id=7, ar_admin=False))
    try:
        response = client.get("/api/posts?synlighet=publik")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert calls == [(7, "publik")]


def test_list_posts_allows_admin_filtering(monkeypatch):
    calls: list[tuple[int | None, str | None]] = []

    def _fake_get_all_posts(anvandar_id=None, synlighet=None):
        calls.append((anvandar_id, synlighet))
        return [PUBLIC_POST]

    monkeypatch.setattr("app.routers.posts.post_repo.get_all_posts", _fake_get_all_posts)
    app.dependency_overrides[get_current_user] = _override_required(CurrentUser(anvandar_id=1, ar_admin=True))
    try:
        response = client.get("/api/posts?anvandar_id=7&synlighet=publik")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert calls == [(7, "publik")]
