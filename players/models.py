from django.db import models
from lobby.models import ActiveGames

class Players(models.Model):
    id = models.UUIDField(primary_key=True, editable=False)
    character = models.CharField()
    # user_name = models.CharField()
    out_of_game = models.BooleanField()
    is_players_turn = models.BooleanField()
    player_number = models.IntegerField()
    current_position = models.CharField()
    note_pad = models.JSONField()
    game = models.ForeignKey(ActiveGames, on_delete=models.CASCADE)

    def __str__(self):
        return f"[{self.id},{self.character},{self.game}]"

class Cards(models.Model):
    value = models.CharField(primary_key=True, editable=False)
    type = models.CharField(editable=False)
    players_holding = models.ManyToManyField(Players)
