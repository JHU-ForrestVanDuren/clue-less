from django.db import models
import uuid

class ActiveGames(models.Model):
    game_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # def __str__(self):
    #     return self.question_text
