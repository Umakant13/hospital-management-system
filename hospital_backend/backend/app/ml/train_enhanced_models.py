import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# TensorFlow/Keras for Deep Learning
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    HAS_TENSORFLOW = True
except ImportError:
    print("TensorFlow not installed. Deep Learning model will be skipped.")
    HAS_TENSORFLOW = False

def create_enhanced_dataset():
    """Create expanded dataset with 20+ symptoms and 15 diseases"""
    
    # Define symptoms (20 symptoms)
    symptoms = [
        'fever', 'cough', 'fatigue', 'headache', 'sore_throat',
        'body_ache', 'runny_nose', 'nausea', 'shortness_of_breath',
        'chest_pain', 'dizziness', 'vomiting', 'diarrhea',
        'abdominal_pain', 'rash', 'joint_pain', 'muscle_pain',
        'loss_of_taste', 'loss_of_smell', 'chills'
    ]
    
    # Create training data (100+ samples)
    # Format: [symptom values (0/1)] + disease label
    data = []
    
    # Flu (15 samples)
    flu_patterns = [
        [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,1,1,0,0,1],
        [1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1],
        [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1],
        [1,1,1,1,0,1,0,1,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
        [1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1],
        [1,0,1,0,0,1,0,1,0,0,1,1,0,0,0,0,1,0,0,1],
        [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,1,1,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1],
        [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,0,1,0,0,0,1,0,0,0,0,1,0,0,1],
        [1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1]
    ]
    for pattern in flu_patterns:
        data.append(pattern + ['Flu'])
    
    # Common Cold (12 samples)
    cold_patterns = [
        [0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [0,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0],
        [0,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
    for pattern in cold_patterns:
        data.append(pattern + ['Common Cold'])
    
    # COVID-19 (10 samples)
    covid_patterns = [
        [1,1,1,1,0,1,0,0,1,0,0,0,0,0,0,0,1,1,1,1],
        [1,0,1,0,1,1,0,0,1,0,0,0,1,0,0,0,1,1,1,1],
        [1,1,1,1,0,1,0,1,1,0,0,1,0,0,0,0,0,1,1,1],
        [1,1,1,0,0,1,0,0,1,1,0,0,0,0,0,1,1,1,1,1],
        [1,0,1,1,1,1,0,0,1,0,0,0,1,0,0,0,1,1,1,0],
        [1,1,1,0,0,1,0,0,1,0,1,0,0,0,0,0,1,1,1,1],
        [1,1,1,1,0,1,0,0,1,0,0,0,0,0,0,1,1,1,1,1],
        [1,0,1,0,1,1,0,1,1,0,0,1,1,0,0,0,0,1,1,1],
        [1,1,1,1,0,1,0,0,1,0,0,0,0,0,0,0,1,1,1,1],
        [1,1,1,0,0,1,0,0,1,1,0,0,1,0,0,1,1,1,1,1]
    ]
    for pattern in covid_patterns:
        data.append(pattern + ['COVID-19'])
    
    # Migraine (8 samples)
    migraine_patterns = [
        [0,0,1,1,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,1,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0,0]
    ]
    for pattern in migraine_patterns:
        data.append(pattern + ['Migraine'])
    
    # Strep Throat (7 samples)
    strep_patterns = [
        [1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1]
    ]
    for pattern in strep_patterns:
        data.append(pattern + ['Strep Throat'])
    
    # Gastroenteritis (8 samples)
    gastro_patterns = [
        [0,0,1,0,0,1,0,1,0,0,0,1,1,1,0,0,0,0,0,0],
        [1,0,1,1,0,1,0,1,0,0,0,1,1,1,0,0,0,0,0,0],
        [0,0,1,0,0,0,0,1,0,0,0,1,1,1,0,0,1,0,0,0],
        [0,0,1,1,0,1,0,1,0,0,1,1,1,1,0,0,0,0,0,0],
        [1,0,1,0,0,0,0,1,0,0,0,1,1,1,0,0,0,0,0,1],
        [0,0,1,0,0,1,0,1,0,0,0,1,1,1,0,0,1,0,0,0],
        [0,0,1,1,0,0,0,1,0,0,0,1,1,1,0,0,0,0,0,0],
        [1,0,1,0,0,1,0,1,0,0,0,1,1,1,0,0,0,0,0,0]
    ]
    for pattern in gastro_patterns:
        data.append(pattern + ['Gastroenteritis'])
    
    # Pneumonia (8 samples)
    pneumonia_patterns = [
        [1,1,1,0,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,1],
        [1,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,1],
        [1,1,1,0,0,1,0,0,1,1,1,0,0,0,0,1,1,0,0,1],
        [1,1,1,0,1,1,0,0,1,1,0,0,0,0,0,0,1,0,0,1],
        [1,1,1,1,0,1,0,1,1,1,0,0,0,0,0,0,1,0,0,1],
        [1,1,1,0,0,1,0,0,1,1,0,0,0,0,0,1,1,0,0,1],
        [1,1,1,0,0,1,0,0,1,1,1,0,0,0,0,0,1,0,0,1],
        [1,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,1]
    ]
    for pattern in pneumonia_patterns:
        data.append(pattern + ['Pneumonia'])
    
    # Bronchitis (7 samples)
    bronchitis_patterns = [
        [0,1,1,0,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,0],
        [1,1,1,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
        [0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,0],
        [0,1,1,0,1,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
        [1,1,1,0,0,1,0,0,1,1,0,0,0,0,0,1,1,0,0,0],
        [0,1,1,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
        [0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,1,0,0,0]
    ]
    for pattern in bronchitis_patterns:
        data.append(pattern + ['Bronchitis'])
    
    # Sinusitis (6 samples)
    sinusitis_patterns = [
        [0,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
    for pattern in sinusitis_patterns:
        data.append(pattern + ['Sinusitis'])
    
    # Allergies (6 samples)
    allergies_patterns = [
        [0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [0,0,1,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [0,1,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [0,0,1,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
        [0,1,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0]
    ]
    for pattern in allergies_patterns:
        data.append(pattern + ['Allergies'])
    
    # Food Poisoning (7 samples)
    food_poisoning_patterns = [
        [0,0,1,0,0,1,0,1,0,0,1,1,1,1,0,0,0,0,0,0],
        [1,0,1,1,0,1,0,1,0,0,0,1,1,1,0,0,0,0,0,0],
        [0,0,1,0,0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,1],
        [0,0,1,1,0,1,0,1,0,0,0,1,1,1,0,0,0,0,0,0],
        [1,0,1,0,0,0,0,1,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,1,0,0,1,0,1,0,0,0,1,1,1,0,0,1,0,0,0],
        [0,0,1,1,0,0,0,1,0,0,1,1,1,1,0,0,0,0,0,1]
    ]
    for pattern in food_poisoning_patterns:
        data.append(pattern + ['Food Poisoning'])
    
    # Dengue (7 samples)
    dengue_patterns = [
        [1,0,1,1,0,1,0,1,0,0,0,1,0,0,1,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,1,0,0,1,1,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,0,0,1,1,1,0,0,1],
        [1,0,1,1,0,1,0,0,0,0,0,0,0,1,1,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,1,1,0,0,1,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,0,0,1,1,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,0,0,1,1,1,0,0,1]
    ]
    for pattern in dengue_patterns:
        data.append(pattern + ['Dengue'])
    
    # Malaria (6 samples)
    malaria_patterns = [
        [1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,1,0,0,0,0,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,1,0,0,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,0,0,0,0,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,1,1,0,0,0,1,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,0,0,0,1,1,0,0,1]
    ]
    for pattern in malaria_patterns:
        data.append(pattern + ['Malaria'])
    
    # Typhoid (6 samples)
    typhoid_patterns = [
        [1,0,1,1,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,1,1,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,0,1,1,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,0,1,1,0,0,0,0,0,1]
    ]
    for pattern in typhoid_patterns:
        data.append(pattern + ['Typhoid'])
    
    # Chronic Fatigue Syndrome (5 samples)
    cfs_patterns = [
        [0,0,1,1,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0],
        [0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0],
        [0,0,1,1,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0],
        [0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0],
        [0,0,1,1,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0]
    ]
    for pattern in cfs_patterns:
        data.append(pattern + ['Chronic Fatigue Syndrome'])
    
    # Convert to DataFrame
    columns = symptoms + ['disease']
    df = pd.DataFrame(data, columns=columns)
    
    return df, symptoms

def train_random_forest(X_train, X_test, y_train, y_test):
    """Train Random Forest model"""
    print("\n=== Training Random Forest Model ===")
    
    rf_model = RandomForestClassifier(n_estimators=200, random_state=42, max_depth=10)
    rf_model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Random Forest Accuracy: {accuracy:.2%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return rf_model, accuracy

def train_deep_learning(X_train, X_test, y_train, y_test, num_classes):
    """Train Deep Learning model"""
    if not HAS_TENSORFLOW:
        print("\nSkipping Deep Learning model (TensorFlow not installed)")
        return None, 0
    
    print("\n=== Training Deep Learning Model ===")
    
    # Convert labels to categorical
    from sklearn.preprocessing import LabelEncoder
    label_encoder = LabelEncoder()
    y_train_encoded = label_encoder.fit_transform(y_train)
    y_test_encoded = label_encoder.transform(y_test)
    
    y_train_cat = keras.utils.to_categorical(y_train_encoded, num_classes)
    y_test_cat = keras.utils.to_categorical(y_test_encoded, num_classes)
    
    # Build Neural Network
    model = keras.Sequential([
        layers.Input(shape=(X_train.shape[1],)),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Train
    history = model.fit(
        X_train, y_train_cat,
        epochs=100,
        batch_size=8,
        validation_data=(X_test, y_test_cat),
        verbose=0
    )
    
    # Evaluate
    _, accuracy = model.evaluate(X_test, y_test_cat, verbose=0)
    
    print(f"Deep Learning Accuracy: {accuracy:.2%}")
    
    return model, accuracy, label_encoder

def main():
    print("Creating Enhanced Disease Prediction Models...")
    print("=" * 60)
    
    # Create dataset
    df, symptoms = create_enhanced_dataset()
    print(f"\nDataset created: {len(df)} samples, {len(symptoms)} symptoms, {df['disease'].nunique()} diseases")
    print(f"Diseases: {', '.join(df['disease'].unique())}")
    
    # Prepare data
    X = df.drop('disease', axis=1).values
    y = df['disease'].values
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train Random Forest
    rf_model, rf_accuracy = train_random_forest(X_train, X_test, y_train, y_test)
    
    # Train Deep Learning
    num_classes = len(df['disease'].unique())
    dl_result = train_deep_learning(X_train, X_test, y_train, y_test, num_classes)
    
    # Create models directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(script_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    print(f"\n📁 Models directory: {models_dir}")
    
    # Save Random Forest
    rf_model_path = os.path.join(models_dir, 'disease_model.pkl')
    symptoms_path = os.path.join(models_dir, 'symptoms.pkl')
    
    joblib.dump(rf_model, rf_model_path)
    joblib.dump(symptoms, symptoms_path)
    
    print(f"\n✓ Random Forest model saved to: {rf_model_path}")
    print(f"✓ Symptoms list saved to: {symptoms_path}")
    
    # Save Deep Learning
    if dl_result[0] is not None:
        dl_model, dl_accuracy, label_encoder = dl_result
        dl_model_path = os.path.join(models_dir, 'dl_disease_model.h5')
        encoder_path = os.path.join(models_dir, 'label_encoder.pkl')
        
        dl_model.save(dl_model_path)
        joblib.dump(label_encoder, encoder_path)
        
        print(f"✓ Deep Learning model saved to: {dl_model_path}")
        print(f"✓ Label encoder saved to: {encoder_path}")
        
        # Model comparison
        print("\n" + "=" * 60)
        print("MODEL COMPARISON")
        print("=" * 60)
        print(f"Random Forest Accuracy: {rf_accuracy:.2%}")
        print(f"Deep Learning Accuracy: {dl_accuracy:.2%}")
        print(f"Best Model: {'Deep Learning' if dl_accuracy > rf_accuracy else 'Random Forest'}")
    
    # Generate disease information database
    print("\n" + "=" * 60)
    print("GENERATING DISEASE INFORMATION DATABASE")
    print("=" * 60)
    
    disease_info = generate_disease_info()
    disease_info_path = os.path.join(models_dir, 'disease_info.json')
    
    import json
    with open(disease_info_path, 'w') as f:
        json.dump(disease_info, f, indent=2)
    
    print(f"✓ Disease information saved to: {disease_info_path}")
    print(f"✓ Generated info for {len(disease_info)} diseases")
    
    print("\n✓ All models trained successfully!")
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Test the AI Health Assistant in the patient portal")
    print("3. Try both Random Forest and Deep Learning models")

def generate_disease_info():
    """Generate comprehensive disease information database"""
    return {
        "Flu": {
            "description": "Influenza (flu) is a contagious respiratory illness caused by influenza viruses that infect the nose, throat, and sometimes the lungs.",
            "precautions": [
                "Get vaccinated annually",
                "Wash hands frequently",
                "Avoid close contact with sick people",
                "Cover coughs and sneezes",
                "Stay home when sick"
            ],
            "medications": [
                "Antiviral drugs (Tamiflu, Relenza)",
                "Acetaminophen for fever",
                "Ibuprofen for pain",
                "Decongestants",
                "Cough suppressants"
            ],
            "diet": [
                "Drink plenty of fluids (water, warm tea, soup)",
                "Eat light, easy-to-digest foods",
                "Consume vitamin C rich foods",
                "Chicken soup",
                "Avoid alcohol and caffeine"
            ],
            "severity": "Moderate",
            "specialist": "General Physician or Family Doctor"
        },
        "Common Cold": {
            "description": "The common cold is a viral infection of your upper respiratory tract — your nose and throat. It's usually harmless, although it might not feel that way.",
            "precautions": [
                "Wash hands regularly",
                "Avoid touching face",
                "Stay away from sick people",
                "Disinfect surfaces",
                "Get adequate sleep"
            ],
            "medications": [
                "Decongestants",
                "Antihistamines",
                "Pain relievers (acetaminophen, ibuprofen)",
                "Cough syrup",
                "Throat lozenges"
            ],
            "diet": [
                "Warm liquids (tea, soup)",
                "Honey and lemon",
                "Vitamin C foods",
                "Garlic",
                "Ginger tea"
            ],
            "severity": "Mild",
            "specialist": "General Physician"
        },
        "COVID-19": {
            "description": "COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus. It can range from mild to severe and may cause serious complications.",
            "precautions": [
                "Get vaccinated and boosted",
                "Wear masks in crowded places",
                "Maintain social distancing",
                "Wash hands frequently",
                "Isolate if infected",
                "Improve ventilation indoors"
            ],
            "medications": [
                "Consult doctor for antiviral medications",
                "Acetaminophen for fever",
                "Cough suppressants",
                "Oxygen therapy if needed",
                "Monoclonal antibodies (if eligible)"
            ],
            "diet": [
                "Stay well hydrated",
                "Protein-rich foods",
                "Fruits and vegetables",
                "Vitamin D supplements",
                "Zinc-rich foods"
            ],
            "severity": "Moderate to Severe",
            "specialist": "Infectious Disease Specialist or Pulmonologist"
        },
        "Migraine": {
            "description": "A migraine is a headache that can cause severe throbbing pain or a pulsing sensation, usually on one side of the head, often accompanied by nausea and sensitivity to light and sound.",
            "precautions": [
                "Identify and avoid triggers",
                "Maintain regular sleep schedule",
                "Manage stress",
                "Stay hydrated",
                "Avoid bright lights and loud noises"
            ],
            "medications": [
                "Triptans",
                "NSAIDs (ibuprofen, naproxen)",
                "Anti-nausea medications",
                "Preventive medications (beta-blockers, antidepressants)",
                "CGRP inhibitors"
            ],
            "diet": [
                "Avoid trigger foods (aged cheese, processed meats)",
                "Limit caffeine",
                "Eat regular meals",
                "Stay hydrated",
                "Magnesium-rich foods"
            ],
            "severity": "Moderate",
            "specialist": "Neurologist"
        },
        "Strep Throat": {
            "description": "Strep throat is a bacterial infection that can make your throat feel sore and scratchy. It's caused by group A Streptococcus bacteria.",
            "precautions": [
                "Wash hands frequently",
                "Don't share utensils or drinks",
                "Cover mouth when coughing",
                "Replace toothbrush after infection",
                "Complete full antibiotic course"
            ],
            "medications": [
                "Antibiotics (penicillin, amoxicillin)",
                "Pain relievers",
                "Throat lozenges",
                "Anti-inflammatory medications"
            ],
            "diet": [
                "Warm liquids (tea, soup)",
                "Soft foods",
                "Honey",
                "Ice cream or popsicles",
                "Avoid spicy or acidic foods"
            ],
            "severity": "Moderate",
            "specialist": "General Physician or ENT Specialist"
        },
        "Gastroenteritis": {
            "description": "Gastroenteritis is an inflammation of the digestive tract, particularly the stomach and intestines, usually caused by viral or bacterial infection.",
            "precautions": [
                "Wash hands thoroughly",
                "Avoid contaminated food and water",
                "Practice food safety",
                "Stay hydrated",
                "Isolate if contagious"
            ],
            "medications": [
                "Oral rehydration solutions",
                "Anti-diarrheal medications (if appropriate)",
                "Antiemetics for nausea",
                "Probiotics",
                "Antibiotics (only if bacterial)"
            ],
            "diet": [
                "BRAT diet (Bananas, Rice, Applesauce, Toast)",
                "Clear liquids",
                "Electrolyte drinks",
                "Avoid dairy, fatty, and spicy foods",
                "Gradually reintroduce solid foods"
            ],
            "severity": "Mild to Moderate",
            "specialist": "Gastroenterologist"
        },
        "Pneumonia": {
            "description": "Pneumonia is an infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus, causing cough with phlegm, fever, chills, and difficulty breathing.",
            "precautions": [
                "Get vaccinated (pneumococcal, flu)",
                "Practice good hygiene",
                "Don't smoke",
                "Maintain healthy immune system",
                "Avoid sick people"
            ],
            "medications": [
                "Antibiotics (for bacterial pneumonia)",
                "Antivirals (for viral pneumonia)",
                "Fever reducers",
                "Cough medicine",
                "Oxygen therapy if needed"
            ],
            "diet": [
                "Plenty of fluids",
                "Protein-rich foods",
                "Fruits and vegetables",
                "Warm liquids",
                "Easy-to-digest foods"
            ],
            "severity": "Moderate to Severe",
            "specialist": "Pulmonologist"
        },
        "Bronchitis": {
            "description": "Bronchitis is an inflammation of the lining of your bronchial tubes, which carry air to and from your lungs. It often develops from a cold or other respiratory infection.",
            "precautions": [
                "Avoid smoking and secondhand smoke",
                "Wash hands frequently",
                "Get flu vaccine",
                "Avoid air pollution",
                "Use humidifier"
            ],
            "medications": [
                "Cough medicine",
                "Bronchodilators",
                "Anti-inflammatory drugs",
                "Antibiotics (if bacterial)",
                "Mucolytics"
            ],
            "diet": [
                "Warm fluids",
                "Honey and lemon",
                "Ginger tea",
                "Turmeric milk",
                "Avoid cold drinks"
            ],
            "severity": "Mild to Moderate",
            "specialist": "Pulmonologist"
        },
        "Sinusitis": {
            "description": "Sinusitis is an inflammation or swelling of the tissue lining the sinuses, often caused by infection, allergies, or other factors.",
            "precautions": [
                "Keep nasal passages moist",
                "Avoid allergens",
                "Use humidifier",
                "Practice good hygiene",
                "Manage allergies"
            ],
            "medications": [
                "Decongestants",
                "Nasal corticosteroids",
                "Saline nasal irrigation",
                "Pain relievers",
                "Antibiotics (if bacterial)"
            ],
            "diet": [
                "Spicy foods (to clear sinuses)",
                "Warm liquids",
                "Vitamin C foods",
                "Garlic and onions",
                "Avoid dairy (may increase mucus)"
            ],
            "severity": "Mild to Moderate",
            "specialist": "ENT Specialist"
        },
        "Allergies": {
            "description": "Allergies occur when your immune system reacts to a foreign substance such as pollen, pet dander, or certain foods.",
            "precautions": [
                "Identify and avoid triggers",
                "Keep windows closed during high pollen",
                "Use air purifiers",
                "Wash bedding regularly",
                "Shower after being outdoors"
            ],
            "medications": [
                "Antihistamines",
                "Nasal corticosteroids",
                "Decongestants",
                "Leukotriene modifiers",
                "Immunotherapy (allergy shots)"
            ],
            "diet": [
                "Anti-inflammatory foods",
                "Quercetin-rich foods (apples, onions)",
                "Omega-3 fatty acids",
                "Probiotics",
                "Avoid trigger foods"
            ],
            "severity": "Mild to Moderate",
            "specialist": "Allergist or Immunologist"
        },
        "Food Poisoning": {
            "description": "Food poisoning is an illness caused by eating contaminated food, usually by bacteria, viruses, or parasites.",
            "precautions": [
                "Practice food safety",
                "Cook food thoroughly",
                "Refrigerate perishables promptly",
                "Wash hands and surfaces",
                "Avoid cross-contamination"
            ],
            "medications": [
                "Oral rehydration solutions",
                "Anti-diarrheal medications (with caution)",
                "Antiemetics",
                "Antibiotics (if severe bacterial infection)",
                "Probiotics"
            ],
            "diet": [
                "Clear liquids initially",
                "BRAT diet",
                "Electrolyte drinks",
                "Gradually reintroduce foods",
                "Avoid dairy, fatty, and spicy foods"
            ],
            "severity": "Mild to Moderate",
            "specialist": "General Physician or Gastroenterologist"
        },
        "Dengue": {
            "description": "Dengue is a mosquito-borne viral infection causing flu-like illness and can develop into severe dengue, a potentially lethal complication.",
            "precautions": [
                "Use mosquito repellent",
                "Wear protective clothing",
                "Use mosquito nets",
                "Eliminate standing water",
                "Stay in air-conditioned areas"
            ],
            "medications": [
                "Acetaminophen for fever (avoid aspirin/ibuprofen)",
                "IV fluids for severe cases",
                "Platelet transfusion if needed",
                "No specific antiviral treatment",
                "Hospitalization for severe dengue"
            ],
            "diet": [
                "Plenty of fluids",
                "Papaya leaf juice",
                "Coconut water",
                "Pomegranate juice",
                "Vitamin C rich foods"
            ],
            "severity": "Moderate to Severe",
            "specialist": "Infectious Disease Specialist"
        },
        "Malaria": {
            "description": "Malaria is a life-threatening disease caused by parasites transmitted through the bites of infected mosquitoes.",
            "precautions": [
                "Use antimalarial medications when traveling",
                "Sleep under mosquito nets",
                "Use insect repellent",
                "Wear protective clothing",
                "Eliminate mosquito breeding sites"
            ],
            "medications": [
                "Antimalarial drugs (chloroquine, artemisinin-based)",
                "Fever reducers",
                "IV fluids for severe cases",
                "Hospitalization for complicated malaria"
            ],
            "diet": [
                "High-calorie, high-protein diet",
                "Plenty of fluids",
                "Fresh fruits and vegetables",
                "Easily digestible foods",
                "Avoid fatty foods"
            ],
            "severity": "Severe",
            "specialist": "Infectious Disease Specialist"
        },
        "Typhoid": {
            "description": "Typhoid fever is a bacterial infection caused by Salmonella typhi, spread through contaminated food and water.",
            "precautions": [
                "Get vaccinated",
                "Drink safe water",
                "Eat properly cooked food",
                "Practice good hygiene",
                "Avoid street food in endemic areas"
            ],
            "medications": [
                "Antibiotics (ciprofloxacin, azithromycin)",
                "Fever reducers",
                "IV fluids",
                "Hospitalization for severe cases"
            ],
            "diet": [
                "High-calorie, high-protein diet",
                "Soft, easily digestible foods",
                "Plenty of fluids",
                "Avoid high-fiber foods initially",
                "Gradual return to normal diet"
            ],
            "severity": "Severe",
            "specialist": "Infectious Disease Specialist"
        },
        "Chronic Fatigue Syndrome": {
            "description": "Chronic fatigue syndrome (CFS) is a complicated disorder characterized by extreme fatigue that lasts for at least six months and can't be fully explained by an underlying medical condition.",
            "precautions": [
                "Pace activities",
                "Maintain sleep schedule",
                "Manage stress",
                "Avoid overexertion",
                "Keep symptom diary"
            ],
            "medications": [
                "Pain relievers",
                "Antidepressants",
                "Sleep aids",
                "Medications for specific symptoms",
                "Vitamin B12 supplements"
            ],
            "diet": [
                "Balanced, nutritious diet",
                "Small, frequent meals",
                "Avoid sugar and processed foods",
                "Stay hydrated",
                "Consider elimination diet for food sensitivities"
            ],
            "severity": "Moderate",
            "specialist": "Internal Medicine Specialist or Rheumatologist"
        }
    }

if __name__ == "__main__":
    main()

