# ============================================
# TimeForge Backend — AI Engine (Gemini)
# ============================================

import json
import time
import traceback
from typing import Optional
from config import get_settings
from prompts import SYSTEM_INSTRUCTION, ANALYSIS_PROMPT, COACHING_PROMPT, PLAN_PROMPT, WHATIF_PROMPT

settings = get_settings()

# Simple in-memory cache
_cache = {}
CACHE_TTL_ANALYSIS = 6 * 3600   # 6 hours
CACHE_TTL_COACHING = 1 * 3600   # 1 hour
CACHE_TTL_PLAN = 12 * 3600      # 12 hours


def _get_cache(key: str) -> Optional[dict]:
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["ts"] < entry["ttl"]:
            return entry["data"]
        del _cache[key]
    return None


def _set_cache(key: str, data: dict, ttl: int):
    _cache[key] = {"data": data, "ts": time.time(), "ttl": ttl}


def _get_gemini_client():
    """Lazy-load Gemini client."""
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "your-gemini-api-key-here":
        return None
    # Strip any accidental quotes from .env
    api_key = api_key.strip().strip("'").strip('"')
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        print(f"[AI Engine] Failed to initialize Gemini: {e}")
        return None


# Best free tier model (March 2026):
# gemini-2.5-flash-lite: 15 RPM, 1000 RPD — highest free limits
# Fallback: gemini-2.5-flash: 10 RPM, 250 RPD — better reasoning
PRIMARY_MODEL = "gemini-2.5-flash-lite"
FALLBACK_MODEL = "gemini-2.5-flash"


def _call_gemini(prompt: str, retry_count: int = 0) -> Optional[dict]:
    """Call Gemini API and parse JSON response. Retries with fallback model on failure."""
    client = _get_gemini_client()
    if not client:
        return None

    model = PRIMARY_MODEL if retry_count == 0 else FALLBACK_MODEL

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "system_instruction": SYSTEM_INSTRUCTION,
                "temperature": 0.7,
                "response_mime_type": "application/json",
            },
        )

        text = response.text.strip()
        # Parse JSON response
        result = json.loads(text)
        return result

    except json.JSONDecodeError as e:
        print(f"[AI Engine] JSON parse error: {e}")
        print(f"[AI Engine] Raw response: {text[:500]}")
        # Retry once — sometimes the model outputs markdown-wrapped JSON
        if retry_count == 0:
            print(f"[AI Engine] Retrying with fallback model...")
            return _call_gemini(prompt, retry_count=1)
        return None
    except Exception as e:
        error_msg = str(e).lower()
        print(f"[AI Engine] Gemini API error ({model}): {e}")

        # If rate limited or model not found, try fallback
        if retry_count == 0 and ("429" in error_msg or "rate" in error_msg or "not found" in error_msg or "deprecated" in error_msg):
            print(f"[AI Engine] Trying fallback model: {FALLBACK_MODEL}")
            return _call_gemini(prompt, retry_count=1)

        traceback.print_exc()
        return None


def analyze_behavior(
    user_name: str,
    wake_time: str,
    sleep_time: str,
    goals: list,
    streak: int,
    level: int,
    level_name: str,
    rule_user_type: str,
    logs: list,
    daily_summaries: list,
    user_id: int,
) -> Optional[dict]:
    """Deep behavioral analysis using AI."""
    cache_key = f"analysis_{user_id}"
    cached = _get_cache(cache_key)
    if cached:
        cached["_source"] = "cached"
        return cached

    # Format logs for the prompt
    formatted_logs = ""
    for log in logs[-100:]:  # Limit to last 100 logs
        formatted_logs += f"  {log['date']} | {log['start_time']}-{log['end_time']} | {log['activity']} [{log['category']}] | mood:{log['mood']} energy:{log['energy']}\n"

    # Format daily summaries
    summary_text = ""
    for s in daily_summaries:
        summary_text += f"  {s['date']}: {s['productive_minutes']}min productive, {s['wasted_minutes']}min wasted, {s['log_count']} activities\n"

    prompt = ANALYSIS_PROMPT.format(
        days=len(daily_summaries),
        name=user_name,
        wake_time=wake_time,
        sleep_time=sleep_time,
        goals=", ".join(goals) if goals else "Not set",
        streak=streak,
        level=level,
        level_name=level_name,
        rule_user_type=rule_user_type or "Unknown",
        formatted_logs=formatted_logs or "No logs yet.",
        daily_summaries=summary_text or "No data yet.",
    )

    result = _call_gemini(prompt)
    if result:
        result["_source"] = "ai"
        _set_cache(cache_key, result, CACHE_TTL_ANALYSIS)
    return result


def get_coaching_message(
    user_name: str,
    streak: int,
    compliance: int,
    avg_productive: int,
    avg_wasted: int,
    user_type: str,
    level: int,
    level_name: str,
    user_id: int,
) -> Optional[dict]:
    """Get a personalized coaching message."""
    cache_key = f"coaching_{user_id}"
    cached = _get_cache(cache_key)
    if cached:
        return cached

    from datetime import datetime
    current_time = datetime.now().strftime("%H:%M")

    prompt = COACHING_PROMPT.format(
        name=user_name,
        streak=streak,
        compliance=compliance,
        avg_productive=avg_productive,
        avg_wasted=avg_wasted,
        user_type=user_type or "Unknown",
        level=level,
        level_name=level_name,
        current_time=current_time,
    )

    result = _call_gemini(prompt)
    if result:
        _set_cache(cache_key, result, CACHE_TTL_COACHING)
    return result


def generate_ai_plan(
    user_name: str,
    wake_time: str,
    sleep_time: str,
    goals: list,
    yesterday_summary: dict,
    weak_slots: list,
    user_type: str,
    user_id: int,
) -> Optional[dict]:
    """Generate an AI-optimized daily plan."""
    cache_key = f"plan_{user_id}"
    cached = _get_cache(cache_key)
    if cached:
        return cached

    yesterday_text = json.dumps(yesterday_summary, indent=2) if yesterday_summary else "No data from yesterday"
    weak_text = ", ".join(weak_slots) if weak_slots else "Not enough data"

    prompt = PLAN_PROMPT.format(
        name=user_name,
        wake_time=wake_time,
        sleep_time=sleep_time,
        goals=", ".join(goals) if goals else "Not set",
        yesterday_summary=yesterday_text,
        weak_slots=weak_text,
        user_type=user_type or "Unknown",
    )

    result = _call_gemini(prompt)
    if result:
        _set_cache(cache_key, result, CACHE_TTL_PLAN)
    return result


def analyze_what_if(
    scenario: str,
    avg_productive: int,
    avg_wasted: int,
    streak: int,
    user_type: str,
    goals: list,
) -> Optional[dict]:
    """AI-powered 'What If' scenario analysis. Not cached (unique per query)."""
    prompt = WHATIF_PROMPT.format(
        scenario=scenario,
        avg_productive=avg_productive,
        avg_wasted=avg_wasted,
        streak=streak,
        user_type=user_type or "Unknown",
        goals=", ".join(goals) if goals else "Not set",
    )

    return _call_gemini(prompt)
