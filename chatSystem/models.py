from django.db import models
from lobby.models import ActiveGames
from players.models import Players

class Messages(models.Model):
    game = models.ForeignKey(ActiveGames, on_delete=models.CASCADE)
    message = models.CharField(max_length=1000)
    author = models.ForeignKey(Players, on_delete=models.CASCADE, null = True)

    def __str__(self):
        return f"[{self.id},{self.message}, {self.game}, {self.author}]"
