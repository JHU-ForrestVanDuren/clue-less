from django.urls import path
from . import views

app_name = 'gameBoard'

urlpatterns = [
    path("<uuid:game_id>", views.index, name="index"),
    path("deal/<uuid:game_id>", views.deal, name="deal"),
    path("getHand", views.getHand, name="getHand"),
    path("checkWin", views.checkWin, name="checkWin"),
    path("getPositions/<uuid:game_id>", views.getPositions, name="getPositions"),
    path("getValidMoves/<uuid:game_id>", views.getValidMoves, name="getValidMoves"),
    path("movePlayer/<uuid:game_id>/<uuid:player_id>/<str:room>", views.movePlayer, name="movePlayer"),
    path('getFirstPlayerWithMatch', views.getFirstPlayerWithMatch, name="getFirstPlayerWithMatch")
]