# [Comet Socketio] NOTIFY.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from comet_socketio import utils
from comet_socketio.models import Notification

def notify_user(user, message_type, message):
    """
    Attempts to push a notification to a user. If they are online and connected
    to a socket, then the notification will be pushed via that socket.
    However, if the user is not online then a message will be stored in the
    database until they return.
    """
    message_id = uuid.uuid4()
    if utils.is_connected(user) and user.socket_session != None:
        # User is online, try sending them a message. Client will need to confirm
        # that the message was received in order to remove the database instance.
        try:
            socket = utils.get_socket(user)
            for namespace in socket.active_ns:
                try:
                    namespace.emit("message", {
                        "action": "push_message",
                        "type": message_type,
                        "message": message,
                        "request_confirmation": True,
                        "message_id": str(message_id),
                    })
                except:
                    raise
                return
        except:
            pass

    # Save in the database
    Notification.objects.create(
        user=user,
        message_id=message_id,
        message_type=message_type,
        message=message,
    )

def check_notifications(request):
    """
    Checks for waiting notifications for a user, and adds them to the request
    via Django's messaging framework.
    """
    idle_notifications = Notification.objects.filter(user=request.user)
    for notification in idle_notifications:
        messages.add_message(request, notification.message_type, notification.message)
        notification.delete()

def notification_seen(message_id):
    """
    Removes database reference to the notification after the client has confirmed
    it to be seen.
    """
    Notification.objects.get(message_id=message_id).delete()
