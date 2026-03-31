FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Run uvicorn with proper env expansion
ENTRYPOINT ["sh", "-c"]
CMD ["uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]




