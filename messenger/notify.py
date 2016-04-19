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
from django_socketio import channels

# Attempts to push a notification to a user. If they are online and connected
# to a socket, then the notification will be pushed via that socket.
# However, if the user is not online then a message will be stored in the
# database until they return.
def notifyUser(user, message):
    return
