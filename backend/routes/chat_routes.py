# ============================================
# TimeForge Backend — Chat Routes (SDG Advisor)
# ============================================

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from models import User
import ai_engine

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    source: str  # "ai" or "fallback"


@router.post("", response_model=ChatResponse)
async def chat_with_advisor(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Chat with the SDG 8 Productivity Advisor."""
    if not req.message or len(req.message.strip()) == 0:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(req.message) > 1000:
        raise HTTPException(status_code=400, detail="Message too long (max 1000 characters)")

    # Build context from request + user profile
    ctx = req.context or {}
    ctx["user_name"] = current_user.name
    ctx["user_id"] = current_user.id

    result = ai_engine.chat_with_advisor(
        message=req.message,
        context=ctx,
        user_id=current_user.id,
    )

    if result:
        return ChatResponse(response=result["response"], source=result.get("_source", "ai"))
    else:
        # Return a fallback message if AI fails
        return ChatResponse(
            response="I'm having trouble connecting to the AI service right now. Please try again in a moment, or ask me a simpler question about your productivity data.",
            source="fallback",
        )
