from django.shortcuts import render
from django.http import HttpResponse

def index(request, game_id):
    return render(request, "gameBoard/index.html")
