from django.urls import path
from . import views

app_name = 'gameBoard'

urlpatterns = [
    path("", views.index, name="index"),
]