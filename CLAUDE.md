# Custom-Receipt-Framework

Receipt printing and tracking tool with signature capture support.

## Quick Reference

| Component | Port | Container |
|-----------|------|-----------|
| Frontend | 3001 | receipts-frontend |
| Backend | 8001 | receipts-backend |
| PostgreSQL | 5433 | receipts-db |

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic
- **Frontend**: React 18, Vite, Tailwind CSS, signature_pad
- **Database**: PostgreSQL 16

## Development Workflow

```bash
# Start all services
docker compose up -d

# Watch logs
docker compose logs -f

# Rebuild after code changes
docker compose up --build -d

# Run migrations
docker compose exec backend alembic upgrade head

# Access database
docker compose exec db psql -U receipts -d receipts
```

## Project Structure

```
/opt/Custom-Receipt-Framework/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # API endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── core/          # Config, database
│   └── alembic/           # Migrations
├── frontend/
│   └── src/
│       ├── api/           # API clients
│       ├── components/    # React components
│       ├── pages/         # Page components
│       └── hooks/         # Custom hooks
└── docker-compose.yml
```

## Key Features to Implement

1. Receipt CRUD with auto-increment (RECIBO-00000001)
2. Customer info (Name, NIT, Phone, Email)
3. Line items (description, qty, unit_price, total)
4. Signature pad (fullscreen on mobile)
5. Receipt list with search
6. Half-page print layout (8" x 5.5")

## Database Schema

- `receipts`: Main receipt table with JSONB custom_fields
- `receipt_items`: Line items linked to receipts

## Memory

Claude memory for this project: `/mnt/Claude-Memory/requisition-core.jsonl`

## Related

- Genesis One patterns: Use similar code structure for future integration
- Ecoferr deployment: Docker Compose to production server
