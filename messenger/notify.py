# [Messenger] NOTIFY.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django.contrib import messages

# Other Imports
import uuid
from django_socketio import send
from messenger.models import Notification

def notifyUser(user, message_type, message):
    """
    Attempts to push a notification to a user. If they are online and connected
    to a socket, then the notification will be pushed via that socket.
    However, if the user is not online then a message will be stored in the
    database until they return.
    """
    if user.is_online and user.socket_session != None:
        # User is online, try sending them a message. Client will need to confirm
        # that the message was received.
        message_id = uuid.uuid4()

        # Attempt to send the message via Socket IO
        send(session_id=user.socket_session, message={
            "action": "pmessage",
            "type": message_type,
            "message": message,
            "request_confirmation": True,
            "message_id": str(message_id),
        })
        
    Notification.objects.create(
        user=user,
        message_id=message_id,
        message_type=message_type,
        message=message,
    )
