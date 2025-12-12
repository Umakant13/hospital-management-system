from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, ConfigDict
import joblib
import os
import json
from typing import List, Dict, Optional
import numpy as np

router = APIRouter()

class SymptomInput(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    symptoms: List[int]
    model_type: Optional[str] = "random_forest"  # "random_forest" or "deep_learning"

class DiseaseInfo(BaseModel):
    description: str
    precautions: List[str]
    medications: List[str]
    diet: List[str]
    severity: str
    specialist: str

class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    disease: str
    confidence: float
    model_used: str
    disease_info: Optional[DiseaseInfo] = None

# Load model paths
MODEL_PATH = 'app/ml/models/disease_model.pkl'
DL_MODEL_PATH = 'app/ml/models/dl_disease_model.h5'
SYMPTOMS_PATH = 'app/ml/models/symptoms.pkl'
DISEASE_INFO_PATH = 'app/ml/models/disease_info.json'
LABEL_ENCODER_PATH = 'app/ml/models/label_encoder.pkl'

# Load disease info once at startup
disease_info_db = {}
if os.path.exists(DISEASE_INFO_PATH):
    with open(DISEASE_INFO_PATH, 'r') as f:
        disease_info_db = json.load(f)

def load_disease_info(disease_name: str) -> Optional[Dict]:
    """Load disease information from database"""
    return disease_info_db.get(disease_name)

@router.post("/predict")
async def predict_disease(input_data: SymptomInput):
    """Predict disease using Random Forest or Deep Learning model"""
    
    try:
        model_type = input_data.model_type.lower()
        
        if model_type == "random_forest":
            result = await predict_with_rf(input_data.symptoms)
        elif model_type == "deep_learning":
            result = await predict_with_dl(input_data.symptoms)
        else:
            raise HTTPException(status_code=400, detail="Invalid model_type. Use 'random_forest' or 'deep_learning'")
        
        # Ensure result is a dict before returning
        if not isinstance(result, dict):
            print(f"WARNING: Result is not a dict: {type(result)}")
            result = dict(result) if hasattr(result, '__dict__') else {"error": "Invalid response format"}
        
        print(f"Final response being returned: {result.keys() if isinstance(result, dict) else 'not a dict'}")
        return result
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"ERROR IN PREDICT_DISEASE ENDPOINT: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction endpoint error: {str(e)}")

async def predict_with_rf(symptoms: List[int]):
    """Predict using Random Forest"""
    print(f"=== PREDICT_WITH_RF CALLED ===")
    print(f"Symptoms received: {len(symptoms)} symptoms")
    
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model file not found at {MODEL_PATH}")
        raise HTTPException(status_code=500, detail="Random Forest model not trained yet. Please run: python app/ml/train_enhanced_models.py")
    
    model = None
    feature_names = None
    prediction = None
    confidence = 0.0
    disease_info = None
    
    try:
        print("Loading model and features...")
        # Load model and features
        model = joblib.load(MODEL_PATH)
        print(f"Model loaded successfully: {type(model)}")
        
        feature_names = joblib.load(SYMPTOMS_PATH)
        print(f"Feature names loaded: {len(feature_names)} features")
        
        # Validate symptom array length
        if len(symptoms) != len(feature_names):
            error_msg = f"Invalid symptom array length. Expected {len(feature_names)} symptoms, got {len(symptoms)}"
            print(f"ERROR: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Create DataFrame to avoid feature name warning
        import pandas as pd
        input_df = pd.DataFrame([symptoms], columns=feature_names)
        print(f"Input DataFrame created: shape {input_df.shape}")
        
        # Make prediction
        print("Making prediction...")
        prediction = model.predict(input_df)[0]
        print(f"Prediction: {prediction}")
        
        probabilities = model.predict_proba(input_df)[0]
        confidence = float(max(probabilities))
        print(f"Confidence: {confidence}")
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as model_error:
        print(f"ERROR IN MODEL PREDICTION: {model_error}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(model_error)}")
    
    # If we got here, prediction succeeded. Now try to load disease info (but don't fail if this doesn't work)
    print(f"Loading disease info for: {prediction}")
    try:
        info = load_disease_info(prediction)
        print(f"Disease info loaded: {info is not None}")
        
        if info:
            try:
                print(f"Validating disease info with keys: {info.keys() if isinstance(info, dict) else 'not a dict'}")
                disease_info = DiseaseInfo(**info)
                print("Disease info validated successfully")
            except Exception as validation_err:
                print(f"Warning: Disease info validation failed for {prediction}: {validation_err}")
                disease_info = None
    except Exception as info_error:
        print(f"Warning: Could not load disease info: {info_error}")
        disease_info = None
    
    # Always return a valid response if we have a prediction
    result = {
        "disease": prediction,
        "confidence": confidence,
        "model_used": "Random Forest",
        "disease_info": disease_info
    }
    print(f"Returning result: disease={prediction}, confidence={confidence}, has_info={disease_info is not None}")
    print("=== PREDICT_WITH_RF COMPLETED SUCCESSFULLY ===")
    return result

async def predict_with_dl(symptoms: List[int]):
    """Predict using Deep Learning"""
    if not os.path.exists(DL_MODEL_PATH):
        raise HTTPException(status_code=500, detail="Deep Learning model not trained yet. Please run: python app/ml/train_enhanced_models.py")
    
    try:
        # Import TensorFlow
        import tensorflow as tf
        
        # Load model and encoder
        model = tf.keras.models.load_model(DL_MODEL_PATH)
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        
        # Predict
        symptoms_array = np.array([symptoms])
        predictions = model.predict(symptoms_array, verbose=0)
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class])
        
        # Decode prediction
        disease = label_encoder.inverse_transform([predicted_class])[0]
        
        # Load disease info
        info = load_disease_info(disease)
        disease_info = DiseaseInfo(**info) if info else None
        
        return {
            "disease": disease,
            "confidence": confidence,
            "model_used": "Deep Learning",
            "disease_info": disease_info
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="TensorFlow not installed. Install with: pip install tensorflow")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/compare-models")
async def compare_models(input_data: SymptomInput):
    """Compare predictions from both models"""
    
    try:
        rf_result = await predict_with_rf(input_data.symptoms)
        
        try:
            dl_result = await predict_with_dl(input_data.symptoms)
        except:
            dl_result = None
        
        return {
            "random_forest": rf_result,
            "deep_learning": dl_result,
            "recommendation": "Use the model with higher confidence" if dl_result else "Only Random Forest available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")

class ChatRequest(BaseModel):
    message: str
    context: str = None

@router.post("/chat")
async def chat_response(request: ChatRequest):
    """
    Generate AI responses using Groq API (fast and reliable) with optional system context
    """
    from app.core.config import settings
    import traceback
    
    print("\n" + "="*80)
    print("🤖 AI CHAT REQUEST RECEIVED")
    print("="*80)
    print(f"📝 Message: {request.message[:100]}...")
    print(f"🎯 Context: {request.context[:100] if request.context else 'None'}...")
    
    # Check if Groq API key is configured
    print(f"\n🔑 Checking Groq API Key...")
    print(f"   API Key Present: {bool(settings.GROQ_API_KEY)}")
    if settings.GROQ_API_KEY:
        print(f"   API Key Length: {len(settings.GROQ_API_KEY)}")
        # Strict validation debugging
        raw_key = settings.GROQ_API_KEY
        if raw_key.strip() != raw_key:
            print("⚠️ WARNING: API Key contains leading/trailing whitespace!")
        if raw_key.startswith('"') or raw_key.startswith("'"):
            print("⚠️ WARNING: API Key appears to be wrapped in quotes! Remove them in Render dashboard.")
        if raw_key.startswith("GROQ_API_KEY="):
            print("⚠️ WARNING: API Key includes the variable name! Paste ONLY the value starting with 'gsk_'.")
            
        print(f"   API Key Preview: {settings.GROQ_API_KEY[:10]}...{settings.GROQ_API_KEY[-5:]}")
    
    if not settings.GROQ_API_KEY:
        print("⚠️  No Groq API key found - using fallback responses")
        # Fallback to rule-based responses if no API key
        msg = request.message.lower()
        response = "I'm here to help with the Hospital Management System."
        
        if "appointment" in msg:
            response = "To book an appointment, go to the 'Appointments' section in your dashboard and click 'Book Appointment'."
        elif "doctor" in msg:
            response = "You can view our doctors in the 'Doctors' section. We have specialists in Cardiology, Neurology, and more."
        elif "record" in msg or "history" in msg:
            response = "Your medical records are available under the 'Medical Records' tab."
        elif "lab" in msg or "test" in msg:
            response = "Lab reports can be downloaded from the 'Lab Tests' section once they are completed."
        elif "hello" in msg or "hi" in msg:
            response = "Hello! How can I assist you today?"
        elif "symptom" in msg or "sick" in msg:
            response = "Use our AI Health Assistant to check your symptoms and get disease predictions with precautions and treatment recommendations."
            
        print(f"✅ Returning fallback response: {response[:50]}...")
        print("="*80 + "\n")
        return {"response": response}
    
    try:
        print("\n📦 Importing Groq client...")
        from groq import Groq
        print("✅ Import successful!")
        
        # Initialize Groq client
        print("\n🔧 Initializing Groq client...")
        client = Groq(api_key=settings.GROQ_API_KEY)
        print("✅ Client initialized!")
        
        # Build messages array
        messages = []
        if request.context:
            messages.append({
                "role": "system",
                "content": request.context
            })
            print(f"\n📋 Using system context ({len(request.context)} chars)")
        
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        print(f"\n🚀 Generating AI response with Groq...")
        print(f"   Model: llama-3.3-70b-versatile")
        print(f"   Messages: {len(messages)}")
        
        # Generate response using Groq
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",  # Fast and capable model
            temperature=0.7,
            max_tokens=1024,
        )
        
        response_text = chat_completion.choices[0].message.content
        
        print("✅ Response generated!")
        print(f"   Response length: {len(response_text)} chars")
        print(f"   Response preview: {response_text[:100]}...")
        
        print("\n✅ SUCCESS - Returning AI response")
        print("="*80 + "\n")
        return {"response": response_text}
        
    except ImportError as e:
        print(f"\n❌ IMPORT ERROR:")
        print(f"   {str(e)}")
        print(f"   Traceback:")
        traceback.print_exc()
        print("="*80 + "\n")
        raise HTTPException(
            status_code=500, 
            detail=f"Groq library not installed. Install with: pip install groq"
        )
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR:")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        print(f"   Full Traceback:")
        traceback.print_exc()
        print("="*80 + "\n")
        raise HTTPException(status_code=500, detail=f"AI generation error: {str(e)}")

class GenerateFormRequest(BaseModel):
    field_descriptions: Dict[str, str]

@router.post("/generate-form-data")
async def generate_form_data(request: GenerateFormRequest):
    # Mock AI generation based on field descriptions
    generated_data = {}
    for field, description in request.field_descriptions.items():
        desc_lower = description.lower()
        if "name" in desc_lower:
            generated_data[field] = "John Doe"
        elif "date" in desc_lower:
            generated_data[field] = "2023-10-27"
        elif "symptom" in desc_lower or "complaint" in desc_lower:
            generated_data[field] = "Mild fever and headache for 2 days"
        elif "diagnosis" in desc_lower:
            generated_data[field] = "Viral Infection"
        elif "medication" in desc_lower:
            generated_data[field] = "Paracetamol 500mg"
        elif "dosage" in desc_lower:
            generated_data[field] = "1 tablet twice daily"
        elif "note" in desc_lower:
            generated_data[field] = "Patient advised to rest and drink plenty of fluids."
        else:
            generated_data[field] = "Sample " + field.replace('_', ' ').title()
            
    return generated_data

@router.get("/symptoms")
async def get_symptoms():
    if not os.path.exists(SYMPTOMS_PATH):
        raise HTTPException(status_code=500, detail="Symptoms list not found. Please run: python app/ml/train_enhanced_models.py")
    
    try:
        symptoms = joblib.load(SYMPTOMS_PATH)
        # Format for frontend: "sore_throat" -> "Sore Throat"
        formatted_symptoms = [
            {"id": i, "key": s, "label": s.replace('_', ' ').title()} 
            for i, s in enumerate(symptoms)
        ]
        return formatted_symptoms
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading symptoms: {str(e)}")

@router.get("/disease-info/{disease_name}")
async def get_disease_info(disease_name: str):
    """Get detailed information about a specific disease"""
    info = load_disease_info(disease_name)
    if not info:
        raise HTTPException(status_code=404, detail=f"Disease information not found for: {disease_name}")
    
    return info
