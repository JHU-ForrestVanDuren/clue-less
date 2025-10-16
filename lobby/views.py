from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from lobby.models import ActiveGames
from players.models import Players, Cards
import uuid
import json
from django.views.decorators.csrf import csrf_exempt

def index(request):
    game_list = ActiveGames.objects.all()
    context = {
        "gameList": game_list
    }
    return render(request, "lobby/index.html", context)

@csrf_exempt
def createGame(request):
    body_unicode = request.body.decode('utf-8')
    body_json = json.loads(body_unicode)
    character = body_json.get('character')
    game_uuid = uuid.uuid4()
    player_uuid = uuid.uuid4()
    new_game = ActiveGames(id=game_uuid, num_of_players=1, solution_character='Mr. Green', solution_weapon="Revolver", solution_room="Library")
    new_game.save()
    new_player = Players(id=player_uuid, character=character, out_of_game=False, is_players_turn=True, player_number=1, current_position="Library", note_pad={}, game=new_game)
    new_player.save()
    data = {
        'gameId': str(game_uuid)
    }

    return JsonResponse(data)
