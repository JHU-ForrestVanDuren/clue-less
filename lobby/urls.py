from django.urls import path
from . import views

app_name = 'lobby'

urlpatterns = [
    path("", views.index, name="index"),
    path("createGame/", views.createGame, name="createGame"),
    path("getCharacters/", views.getCharacters, name="getCharacters"),
    path("joinGame/", views.joinGame, name="joinGame"),
    path("getGame/", views.get_game_by_player_id, name="get_game_by_player_id")
]