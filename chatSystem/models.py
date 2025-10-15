from django.db import models
from lobby.models import ActiveGames

class Messages(models.Model):
    id = models.BigIntegerField(primary_key=True, editable=False)
    game_id = models.ForeignKey(ActiveGames, on_delete=models.CASCADE)
    message = models.CharField()
