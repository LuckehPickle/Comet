# [ChatTest] SOCKETS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

# Other Imports
import logging

# Socketio Imports
from socketio.namespace import BaseNameSpace
from socketio.mixins import RoomsMixin, BroadcastMixin
from socketio.sdjango import namespace

# ChatNamespace Class
# Declares the namespace for the socketio chat. This section is based off of
# the gevent-socketio django chat example, found here:
# https://github.com/abourget/gevent-socketio/tree/master/examples/django_chat/chat
@namespace("/chat")
class ChatNamespace(BaseNameSpace, RoomsMixin, BroadcastMixin):
    nicknames = []

    def initialize(self):
        self.logger = logging.getLogger("socketio.chat")
        self.log("Socketio session started.")

    def log(self, message):
        self.logger.info("[{0}] {1}".format(self.socket.sessid, message))

    def on_join(self, room):
        self.room = room
        self.join(room)
        return True

    def on_nickname(self, nickname):
        self.log("Nickname: {0}".format(nickname))
        self.nicknames.append(nickname)
        self.socket.session["nickname"] = nickname
        self.broadcast_event("announcement", "%s has joined." % nickname)
        self.broadcast_event("nicknames", self.nicknames)

    def recv_disconnect(self):
        # Remove nickname from list
        self.log("Disconnected")
        nickname = self.socket.session["nickname"]
        self.nicknames.remove(nickname)
        self.broadcast_event("announcement", "%s has left." % nickname)
        self.broadcast_event("nicknames", self.nicknames)
        self.disconnect(silent=True)
        return True

    def on_user_message(self, message):
        self.log("Message: {0}".format(message))
        self.emit_to_room(self.room, "msg_to_room", self.socket.session["nickname"], message)
        return True
