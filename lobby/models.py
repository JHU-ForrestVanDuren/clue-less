from django.db import models
import uuid

class ActiveGames(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    num_of_players = models.BigIntegerField()
    solution_character = models.CharField(max_length=100)
    solution_room = models.CharField(max_length=100)
    solution_weapon = models.CharField(max_length=100)
    playerPositions = models.JSONField(blank = True, null = True)
    turnNumber = models.BigIntegerField(blank = True, default=1)
    game_started = models.BooleanField(default=False)

    def __str__(self):
        return f"[{self.id},{self.num_of_players},{self.solution_character},{self.solution_room},{self.solution_weapon},{self.playerPositions}]"
