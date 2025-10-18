from django.urls import path
from . import views

app_name = 'gameBoard'

urlpatterns = [
    path("<uuid:game_id>", views.index, name="index"),
    path("deal/<uuid:game_id>", views.deal, name="deal"),
    path("getHand", views.getHand, name="getHand"),
]