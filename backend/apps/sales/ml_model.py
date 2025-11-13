import pandas as pd
import joblib
import os
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
from django.db.models import Sum
from django.db.models.functions import TruncMonth

from .models import Venta, DetalleVenta

# --- Constantes ---
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, 'sales_model.joblib')

# --- Helper para obtener datos filtrados ---
def get_filtered_data(filters):
    """
    Obtiene los datos históricos basados en los filtros del usuario.
    """
    # Empezamos con detalles de ventas completadas
    queryset = DetalleVenta.objects.filter(venta__estado='COMPLETADO')

    # 1. Filtros de Producto/Categoría
    if filters.get('categoria_id') and filters['categoria_id'] != 'all':
        queryset = queryset.filter(producto__categoria_id=filters['categoria_id'])
    
    if filters.get('producto_id') and filters['producto_id'] != 'all':
        queryset = queryset.filter(producto_id=filters['producto_id'])

    # 2. Agrupación por Mes
    # metric: 'monto' (dinero) o 'cantidad' (unidades)
    metric = filters.get('metric', 'monto')
    
    if metric == 'cantidad':
        annot = Sum('cantidad')
    else:
        # Monto = precio * cantidad
        # Nota: Esto asume que precio_unitario está guardado en DetalleVenta
        from django.db.models import F
        annot = Sum(F('precio_unitario') * F('cantidad'))

    datos_agrupados = queryset.annotate(fecha=TruncMonth('venta__fecha_creacion')) \
        .values('fecha') \
        .annotate(valor=annot) \
        .order_by('fecha')

    if not datos_agrupados:
        return None

    df = pd.DataFrame(list(datos_agrupados))
    # Pandas necesita convertir la fecha
    if not df.empty:
        df['fecha'] = pd.to_datetime(df['fecha'])
    
    return df

# --- Función de Entrenamiento Global (Estático) ---
def get_training_data():
    """
    Prepara los datos históricos globales de la BD para el entrenamiento estático.
    """
    print("🤖 [ML] Obteniendo datos de entrenamiento globales...")
    
    ventas_por_mes = Venta.objects.filter(estado='COMPLETADO') \
        .annotate(month=TruncMonth('fecha_creacion')) \
        .values('month') \
        .annotate(total_ventas=Sum('total')) \
        .order_by('month')

    if not ventas_por_mes:
        return None

    df = pd.DataFrame(list(ventas_por_mes))
    df = df.rename(columns={'month': 'fecha', 'total_ventas': 'total'})
    
    if not df.empty:
        df['fecha'] = pd.to_datetime(df['fecha'])
    
    # Feature Engineering
    df['año'] = df['fecha'].dt.year
    df['mes'] = df['fecha'].dt.month
    df['mes_pasado'] = df['total'].shift(1).fillna(0)
    df['trimestre'] = df['fecha'].dt.quarter
    
    return df[['año', 'mes', 'mes_pasado', 'trimestre', 'total']]

def train_model():
    """
    Entrena el modelo RandomForestRegressor global y lo guarda.
    """
    df = get_training_data()
    
    if df is None or df.empty:
        return {"error": "No hay suficientes datos para entrenar el modelo."}

    X = df.drop('total', axis=1)
    y = df['total']

    print(f"🤖 [ML] Entrenando RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=5)
    model.fit(X, y)
    
    joblib.dump(model, MODEL_PATH)
    print(f"🤖 [ML] Modelo entrenado y guardado en {MODEL_PATH}")
    
    return {"status": "Modelo entrenado exitosamente."}

def predict_future_sales(months_to_predict=6):
    """
    Carga el modelo serializado y predice los próximos X meses (Global).
    """
    if not os.path.exists(MODEL_PATH):
        train_model()
        
    try:
        model = joblib.load(MODEL_PATH)
    except:
         return {"error": "No se pudo cargar el modelo de IA."}

    last_sale = Venta.objects.filter(estado='COMPLETADO').order_by('-fecha_creacion').first()
    if not last_sale:
        return {"error": "No hay ventas."}
    
    # Lógica simplificada para predicción global...
    # (Para el dashboard dinámico usamos predict_dynamic, esta queda como fallback o para admin)
    return [] 

# --- Función de Predicción Dinámica (La que usa el Dashboard Nuevo) ---
def predict_dynamic(filters, months_to_predict=6):
    """
    Entrena un modelo rápido basado SOLO en los datos filtrados
    y proyecta X meses.
    """
    df = get_filtered_data(filters)
    
    if df is None or len(df) < 2:
        return {"error": "Insuficientes datos históricos con estos filtros para proyectar (mínimo 2 meses)."}

    # Ingeniería de características simple para proyección al vuelo
    df['mes_idx'] = range(len(df)) # 0, 1, 2... (Tendencia temporal)
    df['mes_del_anio'] = df['fecha'].dt.month
    
    X = df[['mes_idx', 'mes_del_anio']]
    y = df['valor']

    # Entrenar modelo ligero al vuelo
    model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
    model.fit(X, y)

    # Generar fechas futuras
    last_date = df['fecha'].iloc[-1]
    last_idx = df['mes_idx'].iloc[-1]
    
    future_dates = []
    future_X = []
    
    for i in range(1, months_to_predict + 1):
        next_date = last_date + relativedelta(months=i)
        future_dates.append(next_date)
        future_X.append([last_idx + i, next_date.month])
    
    # Predecir
    predictions = model.predict(future_X)
    
    results = []
    for i, date in enumerate(future_dates):
        results.append({
            "fecha": date.strftime("%Y-%m-%d"),
            "prediccion": max(0, predictions[i]) # No permitir negativos
        })
        
    return results