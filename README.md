# Whey Comparator

## Backend API

The backend FastAPI application lives in `apps/api`.

### Setup

```bash
cd apps/api
poetry install
poetry run uvicorn app.main:app --reload
```

To run the worker:

```bash
poetry run celery -A app.tasks worker --loglevel=INFO
```

### Docker Compose

From the repository root:

```bash
docker-compose up --build
```

This launches PostgreSQL, Redis, the FastAPI application and the Celery worker.