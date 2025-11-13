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

from .models import Venta

# --- Constantes ---
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, 'sales_model.joblib')

def get_training_data():
    """
    Prepara los datos históricos de la BD para el entrenamiento.
    Agrupa las ventas por mes.
    """
    print("🤖 [ML] Obteniendo datos de entrenamiento desde la BD...")
    
    # 1. Agrupar ventas completadas por mes
    ventas_por_mes = Venta.objects.filter(estado='COMPLETADO') \
        .annotate(month=TruncMonth('fecha_creacion')) \
        .values('month') \
        .annotate(total_ventas=Sum('total')) \
        .order_by('month')

    if not ventas_por_mes:
        print("🤖 [ML] No hay datos históricos para entrenar.")
        return None

    # 2. Convertir a DataFrame de Pandas
    df = pd.DataFrame(list(ventas_por_mes))
    df = df.rename(columns={'month': 'fecha', 'total_ventas': 'total'})
    
    # --- --- --- --- --- --- --- --- ---
    # --- 👇 CORRECCIÓN 1 (La de antes) ---
    df['fecha'] = pd.to_datetime(df['fecha'])
    # --- ----------------------------- ---
    
    # 3. Ingeniería de Características (Features)
    df['año'] = df['fecha'].dt.year
    df['mes'] = df['fecha'].dt.month
    df['mes_pasado'] = df['total'].shift(1).fillna(0) # Ventas del mes anterior
    df['trimestre'] = df['fecha'].dt.quarter
    
    df_procesado = df[['año', 'mes', 'mes_pasado', 'trimestre', 'total']]
    
    print(f"🤖 [ML] Datos preparados. {len(df_procesado)} meses de historial.")
    return df_procesado

def train_model():
    """
    Entrena el modelo RandomForestRegressor y lo guarda (serializa).
    """
    df = get_training_data()
    
    if df is None or df.empty:
        return {"error": "No hay suficientes datos para entrenar el modelo."}

    X = df.drop('total', axis=1)
    y = df['total']
    X_train, y_train = X, y

    print(f"🤖 [ML] Entrenando RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=5)
    model.fit(X_train, y_train)
    
    joblib.dump(model, MODEL_PATH)
    print(f"🤖 [ML] Modelo entrenado y guardado en {MODEL_PATH}")
    
    return {"status": "Modelo entrenado exitosamente."}

def predict_future_sales(months_to_predict=6):
    """
    Carga el modelo serializado y predice los próximos X meses.
    """
    print("🤖 [ML] Iniciando predicción de ventas futuras...")
    
    if not os.path.exists(MODEL_PATH):
        print("🤖 [ML] Modelo no encontrado. Entrenando primero...")
        train_result = train_model()
        if isinstance(train_result, dict) and 'error' in train_result:
            return train_result # Devuelve el error de entrenamiento si falla
        
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
         return {"error": f"No se pudo cargar el modelo de IA: {str(e)}"}

    last_sale = Venta.objects.filter(estado='COMPLETADO').order_by('-fecha_creacion').first()
    if not last_sale:
        return {"error": "No hay ventas para usar como base de predicción."}
        
    last_month_data = get_training_data()
    if last_month_data is None or last_month_data.empty:
        return {"error": "No hay datos de entrenamiento para predecir."}
        
    last_total = last_month_data['total'].iloc[-1]
    
    # 3. Crear los "features" para los meses futuros
    future_dates = []
    current_date = last_sale.fecha_creacion.date().replace(day=1)
    
    for _ in range(months_to_predict):
        current_date = current_date + relativedelta(months=1)
        future_dates.append(current_date)

    future_df = pd.DataFrame({'fecha': future_dates})
    
    # --- --- --- --- --- --- --- --- ---
    # --- 👇 CORRECCIÓN 2 (La nueva) ---
    # Forzamos a Pandas a reconocer esta columna 'fecha' también
    future_df['fecha'] = pd.to_datetime(future_df['fecha'])
    # --- 👆 FIN DE LA CORRECCIÓN ---
    # --- --- --- --- --- --- --- --- ---
    
    future_df['año'] = future_df['fecha'].dt.year
    future_df['mes'] = future_df['fecha'].dt.month
    future_df['trimestre'] = future_df['fecha'].dt.quarter
    
    future_df['mes_pasado'] = 0
    future_df.loc[0, 'mes_pasado'] = last_total
    
    features_para_predecir = future_df[['año', 'mes', 'mes_pasado', 'trimestre']]
    
    # Predecir iterativamente
    predictions = []
    current_features = features_para_predecir.copy()

    for i in range(months_to_predict):
        # Predecir el mes actual
        pred = model.predict(current_features.iloc[i:i+1])
        predictions.append(pred[0])
        
        # Actualizar el 'mes_pasado' del *siguiente* mes (si existe)
        if i + 1 < len(current_features):
            current_features.loc[i + 1, 'mes_pasado'] = pred[0]
    
    # 5. Formatear salida
    results = []
    for i, date in enumerate(future_dates):
        results.append({
            "fecha": date.strftime("%Y-%m-%d"),
            "prediccion": predictions[i]
        })

    print(f"🤖 [ML] Predicción completada. {results}")
    return results