# your_app_name/consumers.py
import json
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer
import asyncio
from asgiref.sync import async_to_sync, sync_to_async
from players.models import Players
from lobby.models import ActiveGames
from gameBoard.utils import game_timing_thread, updatePlayerAndTurnNumbers, getPositionsFromDB, suggestionMap
from time import sleep

playerIdMap = {}

class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await asyncio.sleep(5)
        stillInGame = False

        for key, value in playerIdMap[self.room_name].items():
            if value == playerIdMap[self.room_name][self.channel_name][0] and key != self.channel_name:
                stillInGame = True
                value[1] = playerIdMap[self.room_name][self.channel_name][1]

        if stillInGame == False:
            senderCharacter = await Players.objects.aget(id=playerIdMap[self.room_name][self.channel_name][0])
            senderCharacter = senderCharacter.character
            message = await sync_to_async(updatePlayerAndTurnNumbers)(playerIdMap[self.room_name][self.channel_name][0], self.room_name)

            if message['turnNumber'] != -1:
                await self.channel_layer.group_send (
                    self.room_group_name, {"type": "leaveGame", 'message': message}
                )
                positions = await sync_to_async(getPositionsFromDB)(self.room_name)
                await self.channel_layer.group_send (
                    self.room_group_name, {"type": "move", "message": positions}
                ) 
                print('test')
                print('test')
                print('test')
                print('test')
                print('test')
                print('test')
                print('test')
                print('test')
                print('test')
                print('test')
                print('test')
                print(message['suggestionMatch'])
                if message['suggestionMatch'] != "":
                    message = {"message": message['suggestionMatch'], "senderCharacter": senderCharacter}
                    for key, value in playerIdMap[self.room_name].items():
                        print(playerIdMap[self.room_name][key][1])
                        playerIdMap[self.room_name][key][1] = ""
                        playerIdMap[self.room_name][key][2] = ""
                        print(playerIdMap[self.room_name][key][1])
                    await self.channel_layer.group_send (
                        self.room_group_name, {"type": "suggestionResponse", "message":message}
                    )

        del playerIdMap[self.room_name][self.channel_name]

        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        messageType = text_data_json["type"]

        print(f'WebSocket Message received for room {self.room_name} of type {messageType}. Broadcasting to all clients.')

        if messageType == "savePlayerId":
            if self.room_name in playerIdMap:
                playerIdMap[self.room_name][self.channel_name] = [text_data_json["message"],"",""]
            else:
                playerIdMap[self.room_name] = {}
                playerIdMap[self.room_name][self.channel_name] = [text_data_json["message"],"",""]

        if messageType == "chat":
            message = text_data_json["message"]
            sender = text_data_json['sender']
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "chat.message", "message": message, "sender": sender}
            )
        elif messageType == "draw":
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "draw"}
            )
        elif messageType == "move":
            message = text_data_json['message']
            
            await self.channel_layer.group_send (
                self.room_group_name, {"type": "move", "message":message}
            ) 
        elif messageType == "moveSingle":
            message = text_data_json['message']
            await self.send(text_data=json.dumps({"type": "move", "message": message}))

        elif messageType == "suggestion":
            message = text_data_json['message']
            sender = text_data_json['sender']
            matchedPlayerNumber = text_data_json['matchedPlayerNumber']
            matches = text_data_json['matches']

            await self.channel_layer.group_send (
                self.room_group_name, {"type": "suggestion", "message":message, "sender": sender, "matchedPlayerNumber": matchedPlayerNumber, "matches": matches}
            ) 
        elif messageType == "accusation":
            message = text_data_json
            await self.channel_layer.group_send (
                self.room_group_name, {"type": "accusation", "message":message}
            )    
        elif messageType == "suggestionResponse":
            message = text_data_json
            for key, value in playerIdMap[self.room_name].items():
                print(playerIdMap[self.room_name][key][1])
                playerIdMap[self.room_name][key][1] = ""
                playerIdMap[self.room_name][key][2] = ""
                print(playerIdMap[self.room_name][key][1])
            await self.channel_layer.group_send (
                self.room_group_name, {"type": "suggestionResponse", "message":message}
            )
        elif messageType == "endTurn":
            message = text_data_json
            await self.channel_layer.group_send (
                self.room_group_name, {"type": "endTurn", "message":message}
            )
        elif messageType == "leaveGame":
            message = text_data_json
            await self.channel_layer.group_send (
                self.room_group_name, {"type": "leaveGame", 'message': message}
            )  

    # Receive chat message from room group
    def chat_message(self, event):
        # forward the event to WebSocket client
        senderId = event.get("sender")
        sender = Players.objects.get(id=senderId)
        sender_character = sender.character
        self.send(text_data=json.dumps({
            "type": "chat",
            "message": event.get("message"),
            "sender": event.get("sender"),
            "sender_character": sender_character,
            "message_id": event.get("message_id"),
            "gameId": event.get("gameId")
        }))

    async def draw(self, event):
        await self.send(text_data=json.dumps({"type": "draw", "message": "Call get hand"}))

    async def move(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({"type": "move", "message": message}))

    async def suggestion(self, event):
        message = event["message"]
        sender = event["sender"]
        matchedPlayerNumber = event["matchedPlayerNumber"]
        matches = event["matches"]
        print('test1')
        print(self.channel_name)
        print(playerIdMap[self.room_name][self.channel_name][0])
        print(type(playerIdMap[self.room_name][self.channel_name][0]))
        matchedPlayer = await Players.objects.filter(game=self.room_name).aget(player_number=matchedPlayerNumber)
        print(matchedPlayer.id)
        print(type(matchedPlayer.id))

        if playerIdMap[self.room_name][self.channel_name][0] == str(matchedPlayer.id):
            print('test2')
            print(matches[0])
            suggestionMap[playerIdMap[self.room_name][self.channel_name][0]] = matches[0]
            print(suggestionMap[playerIdMap[self.room_name][self.channel_name][0]])
            # playerIdMap[self.room_name][self.channel_name][0] = matches[0]
            # print(playerIdMap[self.room_name][self.channel_name][1])
            # playerIdMap[self.room_name][self.channel_name][2] = matchedPlayer.character

        await self.send(text_data=json.dumps({"type": "suggestion", "message": message, "sender": sender, "matchedPlayerNumber": matchedPlayerNumber, "matches": matches}))

    async def accusation(self, event):
        data = event['message']
        message = data["message"]
        sender = data["sender"]
        win = data["win"]
        guess = data["guess"]
        defaultWinner = data["defaultWinner"]
        await self.send(text_data=json.dumps({"type": "accusation", "message": message, "sender": sender, "win": win, "guess": guess, "defaultWinner": defaultWinner}))

    async def suggestionResponse(self, event):
        data = event["message"]
        message = data['message']
        senderCharacter = data['senderCharacter']
        await self.send(text_data=json.dumps({"type": "suggestionResponse", "message": message, "senderCharacter": senderCharacter}))

    async def endTurn(self, event):
        data = event["message"]
        message = data['message']
        currentTurnPlayer = data['currentTurnPlayer']
        await self.send(text_data=json.dumps({"type": "endTurn", "message": message, "currentTurnPlayer": currentTurnPlayer}))

    async def update_timer(self,event):
        message = event['message']
        await self.send(text_data=json.dumps({"type": "updateTimer", "message": message}))

    async def leaveGame(self,event):
        data = event["message"]
        await self.send(text_data=json.dumps({"type": "leaveGame", "playerNumber": data['playerNumber'], 'turnNumber': data['turnNumber'], 'currentPlayerCharacter': data['currentPlayerCharacter'], 'cardsToAdd': data['cardsToAdd']}))