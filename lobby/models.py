from django.db import models
import uuid

class ActiveGames(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    num_of_players = models.BigIntegerField()
    solution_character = models.CharField()
    solution_room = models.CharField()
    solution_weapon = models.CharField()

    def __str__(self):
        return f"[{self.id},{self.num_of_players},{self.solution_character},{self.solution_room},{self.solution_weapon}]"
