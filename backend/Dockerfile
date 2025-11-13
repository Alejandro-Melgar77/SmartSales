# backend/Dockerfile

# Usar imagen base de Python ligera
FROM python:3.10-slim

# Evitar que Python genere archivos .pyc
ENV PYTHONDONTWRITEBYTECODE 1
# Enviar logs directamente a la terminal
ENV PYTHONUNBUFFERED 1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema para PostgreSQL y manejo de imágenes
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del proyecto
COPY . /app/

# Recopilar archivos estáticos (CSS del admin, etc.)
RUN python manage.py collectstatic --noinput

# Exponer el puerto (Gunicorn corre aquí)
EXPOSE 8000

# Comando para iniciar el servidor en producción
CMD ["gunicorn", "smartsales_config.wsgi:application", "--bind", "0.0.0.0:8000"]