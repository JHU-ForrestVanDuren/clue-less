from django.db import models
from lobby.models import ActiveGames

class Messages(models.Model):
    game = models.ForeignKey(ActiveGames, on_delete=models.CASCADE)
    message = models.CharField()

    def __str__(self):
        return f"[{self.id},{self.message}, {self.game}]"
