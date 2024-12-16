from django.shortcuts import render
import joblib
import numpy as np
from django.http import JsonResponse
from backend.models import District

# Home and form views
def home(request):
    return render(request, 'home.html')

def rad_form(request):
    return render(request, 'radius_form.html')

# Load district names from the database
def load_district_data():
    return District.objects.values('name', 'latitude', 'longitude')

DISTRICT_DATA = load_district_data()

def get_districts(request):
    districts = [
        {
            'name': district['name'],
            'latitude': district['latitude'],
            'longitude': district['longitude']
        }
        for district in DISTRICT_DATA
    ]
    return JsonResponse({'districts': districts})


# Load the saved model
model = joblib.load('backend/models/rf_final2.pkl')

def predict_radius(magnitude, depth):
    input_data = np.array([[magnitude, depth]])
    original_radius = model.predict(input_data)[0]

    if np.isnan(original_radius):
        raise ValueError("Predicted radius is NaN.")
    
    return int(round(original_radius))

def radius_prediction(request):
    if request.method == 'GET':
        try:
            # Fetch parameters
            magnitude = request.GET.get('magnitude')
            depth = request.GET.get('depth')
            district_name = request.GET.get('district_name')

            # Check for missing required parameters
            if not all([magnitude, depth]):
                return JsonResponse({'error': 'Missing required parameters.'}, status=400)

            # Convert parameters to appropriate types
            magnitude = float(magnitude)
            depth = int(depth)  # Convert depth to int

            # Look up district data from the database
            if district_name:
                try:
                    district = District.objects.get(name=district_name)
                    latitude = district.latitude
                    longitude = district.longitude
                except District.DoesNotExist:
                    return JsonResponse({'error': f'District "{district_name}" not found.'}, status=404)
            else:
                latitude = None
                longitude = None

            # Predict the radius
            predicted_radius = predict_radius(magnitude, depth)

            # Prepare the response
            response_data = {
                'predicted_radius_kilometers': predicted_radius,
                'latitude': latitude,
                'longitude': longitude,
                'district_name': district_name
            }

            return JsonResponse(response_data)

        except ValueError as e:
            return JsonResponse({'error': f'Invalid input: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
