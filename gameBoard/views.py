from django.shortcuts import render
from django.http import HttpResponse
from chatSystem.models import Messages
from lobby.models import ActiveGames
from django.views.decorators.cache import cache_control

@cache_control(no_cache=True, no_store=True, must_revalidate=True)
def index(request, game_id):
    game = ActiveGames.objects.get(id=game_id)
    messages = Messages.objects.filter(game=game)
    print(messages, flush=True)
    print('test', flush=True)
    context = {
        "messages": messages
    }
    return render(request, "gameBoard/index.html", context)
