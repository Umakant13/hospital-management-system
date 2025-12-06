"""
Quick model generation script - creates basic models immediately
Run this if the full training script is taking too long
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

print("Creating basic disease prediction models...")

# Simple dataset with 20 symptoms
symptoms = [
    'fever', 'cough', 'fatigue', 'headache', 'sore_throat',
    'body_ache', 'runny_nose', 'nausea', 'shortness_of_breath',
    'chest_pain', 'dizziness', 'vomiting', 'diarrhea',
    'abdominal_pain', 'rash', 'joint_pain', 'muscle_pain',
    'loss_of_taste', 'loss_of_smell', 'chills'
]

# Create basic training data (50 samples)
data = []

# Flu (10 samples)
for _ in range(10):
    pattern = [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1]
    data.append(pattern + ['Flu'])

# Common Cold (8 samples)
for _ in range(8):
    pattern = [0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0]
    data.append(pattern + ['Common Cold'])

# COVID-19 (7 samples)
for _ in range(7):
    pattern = [1,1,1,1,0,1,0,0,1,0,0,0,0,0,0,0,1,1,1,1]
    data.append(pattern + ['COVID-19'])

# Migraine (6 samples)
for _ in range(6):
    pattern = [0,0,1,1,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0]
    data.append(pattern + ['Migraine'])

# Gastroenteritis (6 samples)
for _ in range(6):
    pattern = [0,0,1,0,0,1,0,1,0,0,0,1,1,1,0,0,0,0,0,0]
    data.append(pattern + ['Gastroenteritis'])

# Pneumonia (5 samples)
for _ in range(5):
    pattern = [1,1,1,0,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,1]
    data.append(pattern + ['Pneumonia'])

# Bronchitis (4 samples)
for _ in range(4):
    pattern = [0,1,1,0,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,0]
    data.append(pattern + ['Bronchitis'])

# Allergies (4 samples)
for _ in range(4):
    pattern = [0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0]
    data.append(pattern + ['Allergies'])

# Convert to DataFrame
columns = symptoms + ['disease']
df = pd.DataFrame(data, columns=columns)

X = df.drop('disease', axis=1).values
y = df['disease'].values

# Train Random Forest
print("\nTraining Random Forest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save models
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'disease_model.pkl')
symptoms_path = os.path.join(script_dir, 'symptoms.pkl')

joblib.dump(model, model_path)
joblib.dump(symptoms, symptoms_path)

print(f"\n✓ Model saved to: {model_path}")
print(f"✓ Symptoms saved to: {symptoms_path}")
print("\n✓ Basic models created successfully!")
print("\nYou can now use the AI Health Assistant.")
print("For better accuracy, run: python app/ml/train_enhanced_models.py")
