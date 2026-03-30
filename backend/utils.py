import bleach

def sanitize_input(text: str) -> str:
    """Sanitize strings to prevent XSS attacks by stripping HTML tags."""
    if not isinstance(text, str):
        return text
    # strip=True removes the tags rather than escaping them
    return bleach.clean(text, tags=[], attributes={}, strip=True)
