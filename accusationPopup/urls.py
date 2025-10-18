from django.urls import path
from . import views

app_name = 'accusationPopup'

urlpatterns = [
    # path("suggestion/", views.suggestion, name="suggestion"),
    path("", views.accusation, name="accusation")
]