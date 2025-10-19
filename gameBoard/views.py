from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from chatSystem.models import Messages
from lobby.models import ActiveGames
from players.models import Players, Cards
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import csrf_exempt
import json

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
    return render(request, "gameBoard/index.html", context)

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
    
    return HttpResponse()

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
