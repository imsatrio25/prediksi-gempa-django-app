from django.urls import path
from backend.views import home, rad_form, radius_prediction, get_districts

urlpatterns = [
    path('', home, name='home'),
    path('form/', rad_form, name='rad_form'),
    path('get-districts/', get_districts, name='get_districts'),
    path('predict-radius/', radius_prediction, name='radius_prediction'),
]
