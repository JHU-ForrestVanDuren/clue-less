from django.apps import AppConfig
from django.db import connection
import players.signals

class PlayersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'players'
        
            
