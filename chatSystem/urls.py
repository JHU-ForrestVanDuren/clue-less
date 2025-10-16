from django.urls import path
from . import views

app_name = 'chatSystem'

urlpatterns = [
    path("sendMessage/", views.sendMessage, name="sendMessage")
]