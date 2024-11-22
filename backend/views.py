from django.shortcuts import render
import joblib
import numpy as np
import pandas as pd
from django.http import JsonResponse


def home(request):
    return render(request, 'home.html')

def rad_form(request):
    return render(request, 'radius_form.html')



# Load the saved model and scalers
model = joblib.load('backend/models/rf_final.pkl')
def predict_radius(magnitude, depth, phasecount):
    # Prepare the input data for scaling
    input_data = np.array([[phasecount, magnitude, depth]])
    print(f"Input Data: {input_data}")

    
    # Scale the features (magnitude, depth) using scaler_x
    # input_data_scaled = scaler_x.transform(input_data)
    
    # Predict the scaled radius
    # prediction_scaled = model.predict(input_data_scaled)
    original_radius = model.predict(input_data)[0]
    print(f"Predicted Radius: {original_radius}")

    
    # Inverse-transform the prediction to get the radius in the original scale
    # original_radius = scaler_y.inverse_transform(prediction_scaled.reshape(-1, 1))[0, 0]

    if np.isnan(original_radius):
        raise ValueError("Predicted radius is NaN.")
    
    return int(round(original_radius))

# Create a view for prediction
def radius_prediction(request):
    if request.method == 'GET':
        try:
            # Fetch parameters
            magnitude = request.GET.get('magnitude')
            depth = request.GET.get('depth')
            phasecount = request.GET.get('phasecount')
            latitude = request.GET.get('latitude')
            longitude = request.GET.get('longitude')

            # Check for missing required parameters
            if not all([magnitude, depth, phasecount]):
                return JsonResponse({'error': 'Missing required parameters.'}, status=400)

            # Convert parameters to appropriate types
            magnitude = float(magnitude)
            phasecount = float(phasecount)
            depth = int(depth)  # Convert depth to int

            # Optional parameters
            latitude = float(latitude) if latitude else None
            longitude = float(longitude) if longitude else None

            # Predict the radius
            predicted_radius = predict_radius(magnitude, depth, phasecount)

            # Prepare the response
            response_data = {
                'predicted_radius_kilometers': predicted_radius,
                'latitude': latitude,
                'longitude': longitude
            }

            return JsonResponse(response_data)

        except ValueError as e:
            # Handle conversion errors
            return JsonResponse({'error': f'Invalid input: {str(e)}'}, status=400)
        except Exception as e:
            # Catch all other exceptions
            return JsonResponse({'error': str(e)}, status=400)
