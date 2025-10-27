from django.shortcuts import render, redirect
from django.urls import reverse
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from chatSystem.models import Messages
from lobby.models import ActiveGames
from players.models import Players, Cards
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import csrf_exempt
from time import sleep
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
import threading
import math

game_timing_thread = {}

@cache_control(no_cache=True, no_store=True, must_revalidate=True)
def index(request, game_id):
    try:
        game = ActiveGames.objects.get(id=game_id)
        messages = Messages.objects.filter(game=game)
        playerId = request.COOKIES.get('playerId')
        player = Players.objects.get(id=playerId)
        currentTurnPlayer = Players.objects.get(game=game, player_number=game.turnNumber).character
        hand = Cards.objects.filter(players_holding=player).values_list('pk', flat=True)
        hand = list(hand)
        minutes = 0
        seconds = 0

        if str(game_id) in game_timing_thread:
            minutes = math.floor(game_timing_thread[str(game_id)][1]/60)
            seconds = game_timing_thread[str(game_id)][1]%60

        context = {
            "messages": messages,
            "player": player,
            "hand": hand,
            "timerMinutes": minutes,
            "timerSeconds": seconds
        }

        response = render(request, "gameBoard/index.html", context)
        response.set_cookie('playerNumber', player.player_number, path='/game')
        response.set_cookie('turnNumber', game.turnNumber, path='/game')
        response.set_cookie('currentTurnPlayer', currentTurnPlayer, path='/game')
        response.set_cookie('playerCharacter', player.character, path='/game')
        response.set_cookie('gameStarted', game.game_started, path='/game')

        return response
    except:
        return redirect('lobby:index')

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

    game.game_started = True
    game.save()
        
    thread = threading.Thread(target=timer,args=(game_id,))
    game_timing_thread[str(game_id)] = [thread, 300]
    thread.start()  
    
    return HttpResponse()

def timer(game_id):
    channel_layer = get_channel_layer()
    room_group_name = f"chat_{game_id}"
    while game_timing_thread[str(game_id)][1] > -1:
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'update_timer',
                'message': game_timing_thread[str(game_id)][1]
            }
        )

        if game_timing_thread[str(game_id)][1] != 0:
            game_timing_thread[str(game_id)][1] = game_timing_thread[str(game_id)][1] -1

        sleep(1)

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
    game_id = body_json.get('gameId')
    game = ActiveGames.objects.get(id=game_id)
    player = Players.objects.get(id=body_json.get('playerId'))
    players = Players.objects.filter(game=game)
    defaultWinner = None
    win = False

    if weapon == game.solution_weapon and character == game.solution_character and room == game.solution_room:
        win = True
        game.delete()
        game_timing_thread[str(game_id)][1] = -1

    if not win:
        player.out_of_game = True
        game_timing_thread[str(game_id)][1] = 10
        player.save()
        still_in_game_count = 0

        for player in players:
            if not player.out_of_game:
                still_in_game_count = still_in_game_count + 1
                defaultWinner = player.character

        if still_in_game_count > 1:
            defaultWinner = None
        else:
            game.delete()
            game_timing_thread[str(game_id)][1] = -1            
        
    data = {
        "win": win,
        "guess": {"room": room, "weapon": weapon, "character": character},
        "defaultWinner": defaultWinner
    }

    return JsonResponse(data)

@csrf_exempt
def getFirstPlayerWithMatch(request):
    body_unicode = request.body.decode('utf-8')
    body_json = json.loads(body_unicode)
    suggestion = body_json.get('suggestion')
    game_id = body_json.get('gameId')
    game = ActiveGames.objects.get(id=game_id)
    turn_number = game.turnNumber
    num_of_players = game.num_of_players
    players = Players.objects.filter(game=game).order_by('player_number')
    player_number = 0
    i = turn_number

    while (i < num_of_players and player_number == 0):
        cards = Cards.objects.filter(players_holding=players[i].id)

        for card in cards:
            if card.value == suggestion['room'] or card.value == suggestion['character'] or card.value == suggestion['weapon']:
                player_number = i+1

        i = i+1

    i = 0

    while (i < turn_number - 1 and player_number == 0):
        cards = Cards.objects.filter(players_holding=players[i].id)
        for card in cards:
            if card.value == suggestion['room'] or card.value == suggestion['character'] or card.value == suggestion['weapon']:
                player_number = i+1


        i = i+1        

    data = {
        "playerNumber": player_number
    }

    return JsonResponse(data)

def endTurn(request, game_id):
    game = ActiveGames.objects.get(id=game_id)
    players = Players.objects.filter(game=game)
    num_of_player = game.num_of_players
    turn_number = game.turnNumber

    i = turn_number + 1

    while i != turn_number:
        if i > num_of_player:
            i = 1
        else:
            player = players.get(player_number=i)
            if not player.out_of_game:
                game.turnNumber = i
                break
            i = i+1

    game.save()

    currentTurnPlayer = players.get(player_number=game.turnNumber)

    data = {
        'turnNumber': game.turnNumber,
        'currentTurnPlayer': currentTurnPlayer.character
    }

    game_timing_thread[str(game_id)][1] = 300

    return JsonResponse(data)