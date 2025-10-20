from django.shortcuts import render
from chatSystem.models import Messages
from lobby.models import ActiveGames
from players.models import Players
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def sendMessage(request):
    body_unicode = request.body.decode('utf-8')
    body_json = json.loads(body_unicode)
    gameId = body_json.get('gameId')
    message = body_json.get('message')
    userId = body_json.get('userId')
    user = Players.objects.get(id=userId)
    game = ActiveGames.objects.get(id=gameId)
    new_message = Messages(game=game, message=message, author=user)
    new_message.save()
    return HttpResponse(status=200, content = user.id)