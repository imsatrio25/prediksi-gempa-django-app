from django.urls import path
from backend.views import home, radius_prediction

urlpatterns = [
    path('', home, name='index'),  # Home page for the form
    path('predict-radius/', radius_prediction, name='radius_prediction'),
]
