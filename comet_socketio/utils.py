# [Comet Socketio] UTILS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from accounts.models import User
server = None

def set_server(s):
    global server
    server = s

def get_socket(user):
    """
    Returns a socket from a user object
    """
    if user.socket_session == None:
        return None
    return server.get_socket(sessid=user.socket_session)


def is_connected(user):
    """
    Determines whether a user is connected or not
    """
    if not type(user) is User:
        user = User.objects.get(user_id=user)
    socket = get_socket(user)
    if socket == None:
        return False
    return socket.connected
