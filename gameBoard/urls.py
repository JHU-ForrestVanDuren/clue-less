from django.urls import path
from . import views

app_name = 'gameBoard'

urlpatterns = [
    path("<uuid:game_id>", views.index, name="index"),
]