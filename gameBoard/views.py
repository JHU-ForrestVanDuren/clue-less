from django.shortcuts import render
from django.http import HttpResponse
from chatSystem.models import Messages
from lobby.models import ActiveGames
from players.models import Players
from django.views.decorators.cache import cache_control

@cache_control(no_cache=True, no_store=True, must_revalidate=True)
def index(request, game_id):
    game = ActiveGames.objects.get(id=game_id)
    messages = Messages.objects.filter(game=game)
    playerId = request.COOKIES.get('playerId')
    player = Players.objects.get(id=playerId)

    context = {
        "messages": messages,
        "player": player
    }
    return render(request, "gameBoard/index.html", context)
