from django.shortcuts import render
from django.http import JsonResponse
from lobby.models import ActiveGames
from players.models import Players, Cards
import uuid
import json
import random
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

    return response

@csrf_exempt 
def createGame(request):
    body_unicode = request.body.decode('utf-8')
    body_json = json.loads(body_unicode)
    character = body_json.get('character')
    game_uuid = uuid.uuid4()
    player_uuid = uuid.uuid4()
    solution_character = Cards.objects.filter(type="Character").order_by('?').first().value
    solution_weapon = Cards.objects.filter(type="Weapon").order_by('?').first().value
    solution_room = Cards.objects.filter(type="Room").order_by('?').first().value
    InitPos = [
            "h-k-b",
            "h-b-c",
            "h-k-dr",
            "h-b-li",
            "h-c-br",
            "h-dr-li",
            "h-li-br",
            "h-dr-lo",
            "h-li-h",
            "h-br-s",
            "h-lo-h",
            "h-h-s"
    ]
    startPos = random.choice(InitPos)
    posJson = json.dumps({str(player_uuid): startPos})
    new_game = ActiveGames(id=game_uuid, num_of_players=1, solution_character=solution_character, solution_weapon=solution_weapon, solution_room=solution_room, playerPositions=posJson)
    new_game.save()
    new_player = Players(id=player_uuid, character=character, out_of_game=False, is_players_turn=True, player_number=1, current_position=startPos, note_pad={}, game=new_game)
    new_game.save()
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
    players = Players.objects.filter(game=game)
    players_in_game = players.count()
    player_uuid = uuid.uuid4()
    usedPos = json.loads(game.playerPositions).values()
    game.num_of_players += 1
    game.save()
    validPos = [
            "h-k-b",
            "h-b-c",
            "h-k-dr",
            "h-b-li",
            "h-c-br",
            "h-dr-li",
            "h-li-br",
            "h-dr-lo",
            "h-li-h",
            "h-br-s",
            "h-lo-h",
            "h-h-s"
    ]
    for player in players:
        validPos.remove(player.current_position)
    new_player = Players(id=player_uuid, character=character, out_of_game=False, is_players_turn=False, player_number=players_in_game+1, current_position=random.choice(validPos), note_pad={}, game=game)
    new_player.save()
    data = {
        'gameId': str(game_id),
        'playerId': str(player_uuid)
    }

    return JsonResponse(data)
