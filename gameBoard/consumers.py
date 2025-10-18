# your_app_name/consumers.py
import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

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
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "chat.message", "message": message}
            )
        elif messageType == "draw":
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "draw"}
            )
        elif messageType == "suggestion":
            message = text_data_json['message']
            sender = text_data_json['sender']
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "suggestion", "message":message, "sender": sender}
            )         

    # Receive message from room group
    def chat_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        self.send(text_data=json.dumps({"message": message, "type": "chat"}))

    def draw(self, event):
        self.send(text_data=json.dumps({"type": "draw", "message": "Call get hand"}))

    def suggestion(self, event):
        message = event["message"]
        sender = event["sender"]
        self.send(text_data=json.dumps({"type": "suggestion", "message": message, "sender": sender}))