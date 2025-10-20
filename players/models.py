from django.db import models
from lobby.models import ActiveGames

class Players(models.Model):
    id = models.UUIDField(primary_key=True, editable=False)
    character = models.CharField(max_length=100)
    # user_name = models.CharField()
    out_of_game = models.BooleanField()
    is_players_turn = models.BooleanField(default=False)
    player_number = models.IntegerField()
    current_position = models.CharField(max_length=100, null=True)
    moved_by_sugg = models.BooleanField(default=False)
    note_pad = models.JSONField()
    game = models.ForeignKey(ActiveGames, on_delete=models.CASCADE)

    def __str__(self):
        return f"[{self.id},{self.character},{self.game},{self.current_position}]"

class Cards(models.Model):
    value = models.CharField(primary_key=True, editable=False, max_length=100)
    type = models.CharField(editable=False, max_length=50)
    players_holding = models.ManyToManyField(Players)

    def __str__(self):
        return f"[{self.value},{self.type},{self.players_holding}]"
