# Use a lightweight official Python image optimized for ML
FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies needed for compiling ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker caching layers
COPY requirements.txt .

# Install Python dependencies cleanly without cache to keep the image small
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code and models
COPY . .

# Expose the production port
EXPOSE 10000

# Run FastAPI using Uvicorn bound to Render's required network interface
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]