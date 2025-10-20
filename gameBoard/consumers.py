# your_app_name/consumers.py
import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from players.models import Players

class MyConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        messageType = text_data_json["type"]

        if messageType == "chat":
            message = text_data_json["message"]
            sender = text_data_json['sender']
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "chat.message", "message": message, "sender": sender}
            )
        elif messageType == "draw":
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "draw"}
            )
        elif messageType == "move":
            message = text_data_json['message']
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "move", "message":message}
            ) 
        elif messageType == "suggestion":
            message = text_data_json['message']
            sender = text_data_json['sender']
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "suggestion", "message":message, "sender": sender}
            ) 
        elif messageType == "accusation":
            message = text_data_json
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "accusation", "message":message}
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

    def draw(self, event):
        self.send(text_data=json.dumps({"type": "draw", "message": "Call get hand"}))

    def move(self, event):
        message = event["message"]
        self.send(text_data=json.dumps({"type": "move", "message": message}))

    def suggestion(self, event):
        message = event["message"]
        sender = event["sender"]
        self.send(text_data=json.dumps({"type": "suggestion", "message": message, "sender": sender}))

    def accusation(self, event):
        data = event['message']
        message = data["message"]
        sender = data["sender"]
        win = data["win"]
        self.send(text_data=json.dumps({"type": "accusation", "message": message, "sender": sender, "win": win}))