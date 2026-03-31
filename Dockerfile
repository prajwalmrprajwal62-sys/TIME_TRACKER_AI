FROM python:3.11-slim

WORKDIR /app

# Copy requirements from backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Use shell form so $PORT expands
ENTRYPOINT ["sh", "-c"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

