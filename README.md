# Custom-Receipt-Framework

Receipt printing and tracking tool with signature capture support.

## Features

- Create receipts with auto-incrementing numbers (RECIBO-00000001)
- Customer information (Name, NIT, Phone, Email)
- Line items with description, quantity, and price
- Full-screen signature pad (mobile-friendly)
- Search and list receipts
- Half-page print layout (8" x 5.5" Guatemala standard)

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (async)
- **Frontend**: React 18, Vite, Tailwind CSS
- **Database**: PostgreSQL 16
- **Container**: Docker Compose

## Development

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/Custom-Receipt-Framework.git
cd Custom-Receipt-Framework

# Copy environment file
cp .env.example .env

# Start with Docker Compose
docker-compose up --build
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/v1/receipts` - List all receipts
- `POST /api/v1/receipts` - Create new receipt
- `GET /api/v1/receipts/{id}` - Get receipt by ID
- `PUT /api/v1/receipts/{id}` - Update receipt
- `DELETE /api/v1/receipts/{id}` - Delete receipt
- `GET /api/v1/receipts/search?q=` - Search receipts

## Environment Variables

See `.env.example` for configuration options.

## License

MIT
