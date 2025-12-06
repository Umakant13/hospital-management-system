import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

def train_disease_model():
    print("Training Disease Prediction Model...")
    
    # Synthetic Dataset (Symptoms -> Disease)
    # 1 = Present, 0 = Absent
    data = {
        'fever':        [1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1],
        'cough':        [1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1],
        'fatigue':      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        'headache':     [0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1],
        'sore_throat':  [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
        'body_ache':    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1],
        'runny_nose':   [0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0],
        'nausea':       [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        'disease': [
            'Flu', 'Flu', 'Common Cold', 'Migraine', 'Strep Throat', 
            'Flu', 'Chronic Fatigue', 'Flu', 'Common Cold', 'Migraine',
            'Flu', 'Common Cold', 'Migraine', 'Strep Throat', 'Flu'
        ]
    }

    df = pd.DataFrame(data)
    
    X = df.drop('disease', axis=1)
    y = df['disease']

    # Train Model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save Model and Feature Names
    os.makedirs('app/ml/models', exist_ok=True)
    
    model_path = 'app/ml/models/disease_model.pkl'
    features_path = 'app/ml/models/symptoms.pkl'
    
    joblib.dump(model, model_path)
    joblib.dump(list(X.columns), features_path)
    
    print(f"Model saved to {model_path}")
    print(f"Features saved to {features_path}")
    
    # Test Prediction
    test_symptoms = [[1, 1, 1, 0, 0, 1, 0, 0]] # Flu-like
    prediction = model.predict(test_symptoms)
    print(f"Test Prediction (Flu-like symptoms): {prediction[0]}")

if __name__ == "__main__":
    train_disease_model()
