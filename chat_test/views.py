# [ChatTest] VIEWS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
# Powered by Django (https://www.djangoproject.com/) - Not endorsed by Django
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

# Django Imports
from django.http import HttpResponse
from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import get_object_or_404, render, redirect

# Socketio Imports
from socketio import socketio_manage

# Other Imports
from .models import ChatRoom
from .sockets import ChatNamespace

# rooms
# Homepage, lists all rooms
def rooms(request, template="chat-test/rooms.html"):
    context = {
        "rooms": ChatRoom.objects.all(),
    }
    return render(request, template, context)

def room(request, slug, template="chat-test/room.html"):
    context = {
        "room": get_object_or_404(ChatRoom, slug=slug),
    }
    return render(request, template, context)

def create(request):
    name = request.POST["name"]
    if name:
        room, created = ChatRoom.objects.get_or_create(name=name)
        return redirect(room)
    return redirect(rooms)
