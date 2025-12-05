from lobby.models import ActiveGames
from players.models import Players, Cards
from asgiref.sync import async_to_sync, sync_to_async

game_timing_thread = {}
suggestionMap = {}

def updatePlayerAndTurnNumbers(playerId, gameId):
    try:
        game = ActiveGames.objects.get(id=gameId)
        leavingPlayer = Players.objects.get(id=playerId)
    except Exception:
        return {"turnNumber": -1}

    leaving_player_number = leavingPlayer.player_number
    leavingPlayer.player_number = 0
    leavingPlayer.save()

    if leaving_player_number == game.turnNumber and game.game_started:
        game_timing_thread[str(gameId)][1] = 300

        if game.num_of_players == leaving_player_number:
            game.turnNumber = 1

    game.num_of_players = game.num_of_players - 1

    data = {
        "turnNumber": game.turnNumber,
        "currentPlayerCharacter": '',
        "cardsToAdd": {},
        "playerNumber": leaving_player_number,
        "suggestionMatch": ""
    }

    if game.num_of_players == 0:
        data['turnNumber'] = -1
        game.delete()
        return data
    
    elif (game.num_of_players == 1 and game.game_started):
        data['turnNumber'] = 0
        game_timing_thread[str(gameId)][1] = -1
        game.delete()
        return data

    players = Players.objects.filter(game=game)

    for player in players:
        if player.player_number > leaving_player_number:
            if player.player_number == game.turnNumber:
                game.turnNumber = game.turnNumber - 1
                data['turnNumber'] = game.turnNumber
            player.player_number = player.player_number - 1
            player.save()
        if player.player_number == game.turnNumber:
            data['currentPlayerCharacter'] = player.character

    game.save()

    deal_to = 1

    if game.game_started:
        hand = Cards.objects.filter(players_holding=leavingPlayer)

        for card in hand:
            player = players.get(player_number=deal_to)
            card.players_holding.add(player)

            if str(player.player_number) in data['cardsToAdd']:
                data['cardsToAdd'][str(player.player_number)].append(card.value)
            else:
                data['cardsToAdd'][str(player.player_number)] = [card.value]                            

            if deal_to == game.num_of_players:
                deal_to = 1
            else:
                deal_to = deal_to + 1

    if str(leavingPlayer.id) in suggestionMap:
        data['suggestionMatch'] = suggestionMap.pop(str(leavingPlayer.id))

    leavingPlayer.delete()

    return data

def getPositionsFromDB(game_id):
    try:
        game = ActiveGames.objects.get(id=game_id)
    except Exception:
        return {}
    players = Players.objects.filter(game=game)
    data = {}

    for player in players:
        data[str(player.id)] = {
            "position": player.current_position,
            "character": player.character
        }
        player.save()

    return data