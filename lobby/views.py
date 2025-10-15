from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from lobby.models import ActiveGames
import uuid

def index(request):
    game_list = ActiveGames.objects.all()

    context = {
        "gameList": game_list
    }
    print(game_list)
    return render(request, "lobby/index.html", context)

def createGame(request):
    print('testing')
    game_uuid = uuid.uuid4()
    new_game = ActiveGames(game_id=game_uuid)
    new_game.save()

    data = {
        'gameId': str(game_uuid),
        'test': 'stuff'
    }

    return JsonResponse(data)
