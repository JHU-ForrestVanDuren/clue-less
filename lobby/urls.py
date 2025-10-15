from django.urls import path
from . import views

app_name = 'lobby'

urlpatterns = [
    path("", views.index, name="index"),
    path("createGame/", views.createGame, name="createGame")
]