from django.shortcuts import render
from django.http import JsonResponse
from lobby.models import ActiveGames
from players.models import Players
import uuid
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_control

def index(request):
    game_list = ActiveGames.objects.all()
    playerId = request.COOKIES.get('playerId')
    in_game = False

    try:
        Players.objects.get(id=playerId)
        in_game = True
    except:
        print("Player not in game")

    context = {
        "gameList": game_list,
        "inGame": in_game
    }
    
    response = render(request, "lobby/index.html", context)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate'
    response['Pragma'] = "no-cache"
    response['Expires'] = "Wed, 11 Jan 1984 05:00:00 GMT"

    return response

@csrf_exempt 
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
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
        'gameId': str(game_uuid),
        'playerId': str(player_uuid)
    }

    return JsonResponse(data)

@csrf_exempt 
def getCharacters(request):
    body_unicode = request.body.decode('utf-8')
    body_json = json.loads(body_unicode)
    game_id = body_json.get('gameId')
    game = ActiveGames.objects.get(id=game_id)
    players = Players.objects.filter(game=game)
    characters = ["Colonel Mustard", "Professor Plum", "Mrs. Peacock", "Miss Scarlet", "Mr. Green", "Mrs. White"]
    for player in players:
        characters.remove(player.character)

    data = {
        "characters": characters
    }

    return JsonResponse(data)

@csrf_exempt 
def joinGame(request):
    body_unicode = request.body.decode('utf-8')
    body_json = json.loads(body_unicode)
    character = body_json.get('character')
    game_id = body_json.get('gameId')
    game = ActiveGames.objects.get(id=game_id)
    players_in_game = Players.objects.filter(game=game).count()
    player_uuid = uuid.uuid4()
    new_player = Players(id=player_uuid, character=character, out_of_game=False, is_players_turn=False, player_number=players_in_game+1, current_position="Library", note_pad={}, game=game)
    new_player.save()
    data = {
        'gameId': str(game_id),
        'playerId': str(player_uuid)
    }

    return JsonResponse(data)
