"""Backup and restore API endpoints."""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.core.database import get_db
from app.core.deps import get_current_user_required
from app.models.user import User
from app.services.backup_service import export_all_receipts, import_receipts


router = APIRouter(prefix="/backup", tags=["backup"])


@router.get("/export")
async def export_backup(
    current_user: Annotated[User, Depends(get_current_user_required)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Export all receipts to JSON format.
    Returns a backup file that can be downloaded.
    """
    backup_data = await export_all_receipts(session)

    # Return as JSON with proper filename header
    response = JSONResponse(
        content=backup_data,
        headers={
            "Content-Disposition": f"attachment; filename=receipts_backup_{backup_data['created_at'][:10]}.json"
        }
    )
    return response


@router.post("/import")
async def import_backup(
    current_user: Annotated[User, Depends(get_current_user_required)],
    session: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    skip_existing: bool = True
):
    """
    Import receipts from a backup JSON file.

    Args:
        file: JSON backup file
        skip_existing: If True (default), skip receipts that already exist

    Returns:
        Import statistics
    """
    # Validate file type
    if not file.filename or not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un archivo JSON (.json)"
        )

    # Read and parse file
    try:
        content = await file.read()
        backup_data = json.loads(content.decode('utf-8'))
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al parsear el archivo JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al leer el archivo: {str(e)}"
        )

    # Validate backup structure
    if "receipts" not in backup_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo no contiene datos de recibos válidos"
        )

    # Import receipts
    result = await import_receipts(session, backup_data, skip_existing)

    return {
        "message": "Importación completada",
        "imported": result["imported"],
        "skipped": result["skipped"],
        "errors": result["errors"],
        "total_processed": result["total_processed"],
    }
