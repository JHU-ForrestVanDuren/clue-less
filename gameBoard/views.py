from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from chatSystem.models import Messages
from lobby.models import ActiveGames
from players.models import Players, Cards
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import csrf_exempt
import json, random

@cache_control(no_cache=True, no_store=True, must_revalidate=True)
def index(request, game_id):
    game = ActiveGames.objects.get(id=game_id)
    messages = Messages.objects.filter(game=game)
    playerId = request.COOKIES.get('playerId')
    player = Players.objects.get(id=playerId)
    hand = Cards.objects.filter(players_holding=player).values_list('pk', flat=True)
    hand = list(hand)

    context = {
        "messages": messages,
        "player": player,
        "hand": hand
    }

    response = render(request, "gameBoard/index.html", context)
    response.set_cookie('playerNumber', player.player_number)
    response.set_cookie('turnNumber', '1')

    return response

def getPositions (request, game_id):
    game = ActiveGames.objects.get(id=game_id)
    players = Players.objects.filter(game=game)
    data = {}
    for player in players:
        data[str(player.id)] = {
            "position": player.current_position,
            "character": player.character
        }
        player.save()

    return JsonResponse(data)

def movePlayer (request, game_id, player_id, room):
    player = Players.objects.get(id=player_id)
    player.current_position = room
    if not player.moved_by_sugg:
        player.is_players_turn = False
    player.save()

    game = ActiveGames.objects.get(id=game_id)
    players = Players.objects.filter(game=game)
    game.turnNumber += 1
    game.save()
    data = {}
    for player in players:
        playerNum = player.player_number
        if game.turnNumber % playerNum == 0:
            player.is_players_turn == True
        else: player.is_players_turn == False
        data[str(player.id)] = {
            "position": player.current_position,
            "character": player.character,
            "turn?": game.turnNumber,
            "playerNum": game.turnNumber % playerNum
        }
        player.save()

    return JsonResponse(data)

def deal(request, game_id):
    game = ActiveGames.objects.get(id=game_id)
    players = Players.objects.filter(game=game)
    num_of_players = players.count()
    cardsAll = Cards.objects.all().order_by('?')
    cardsExcludeSolution = []
    for card in cardsAll:
        if card.value == game.solution_character or card.value == game.solution_room or card.value == game.solution_weapon:
            print('exclude')
            print(card.value)
            continue
        else:
            cardsExcludeSolution.append(card)

    deal_to = 1

    for card in cardsExcludeSolution:
        player = players.get(player_number=deal_to)
        card.players_holding.add(player)
        if deal_to == num_of_players:
            deal_to = 1
        else:
            deal_to = deal_to + 1

    for player in players:
        player.is_players_turn == False
        player.save()
    
    game.turnNumber = 0
    game.save()
    
    return HttpResponse()

def getValidMoves (request, game_id):
    players = Players.objects.filter(game=game_id)

    playerId = request.COOKIES.get('playerId')
    player = Players.objects.get(id=playerId)
    currentRoom = player.current_position
    
    HallwayMoves = {
        "h-k-b": ["Kitchen", "Ballroom"],
        "h-b-c": ["Ballroom", "Conservatory"],
        "h-k-dr": ["Kitchen", "DiningRoom"],
        "h-b-li": ["Ballroom", "Library"],
        "h-c-br": ["Conservatory","BilliardRoom"],
        "h-dr-li": ["DiningRoom", "Library"],
        "h-li-br": ["Library", "BilliardRoom"],
        "h-dr-lo": ["DiningRoom","Lounge"],
        "h-li-h": ["Library","Hall"],
        "h-br-s": ["BilliardRoom","Study"],
        "h-lo-h": ["Lounge", "Hall"],
        "h-h-s": ["Hall", "Study"]
    }

    RoomMoves = {
        "Kitchen": ["h-k-b", "h-k-dr","Study"],
        "Ballroom": ["h-k-b", "h-b-c", "h-b-li"],
        "Conservatory": ["h-b-c", "h-c-br","Lounge"],
        "DiningRoom": ["h-k-dr", "h-dr-li", "h-dr-lo"],
        "Library": ["h-b-li", "h-dr-li", "h-li-br", "h-li-h"],
        "BilliardRoom": ["h-c-br", "h-li-br", "h-br-s"],
        "Lounge": ["h-dr-lo", "h-lo-h","Conservatory"],
        "Hall": ["h-li-h", "h-lo-h", "h-h-s"],
        "Study": ["h-br-s", "h-h-s","Kitchen"]
    }
    
    if currentRoom in RoomMoves:
        validMoves = RoomMoves[currentRoom]
        for others in players:
            if others.id != player.id and others.current_position in validMoves:
                validMoves.remove(others.current_position)
        if player.moved_by_sugg == True:
            validMoves.append(currentRoom)
        data = {
            "validRooms": validMoves
        }
    elif currentRoom in HallwayMoves:
        validMoves = HallwayMoves[currentRoom]
        data = {
            "validRooms": validMoves
        }
    try:
        return JsonResponse(data)
    except: 
        return HttpResponseBadRequest("<h1>Invalid Request Data<\h1>")


def getHand (request):
    playerId = request.COOKIES.get('playerId')
    player = Players.objects.get(id=playerId)
    hand = Cards.objects.filter(players_holding=player).values_list('pk', flat=True)
    hand = list(hand)

    data = {
        "hand": hand
    }

    return JsonResponse(data)

@csrf_exempt
def checkWin(request):
    body_unicode = request.body.decode('utf-8')
    body_json = json.loads(body_unicode)
    room = body_json.get('room')
    weapon = body_json.get('weapon')
    character = body_json.get('character')
    game = ActiveGames.objects.get(id=body_json.get('gameId'))
    win = False

    if weapon == game.solution_weapon and character == game.solution_character and room == game.solution_room:
        win = True

    print(win)

    data = {
        "win": win
    }

    print(data['win'])

    return JsonResponse(data)
