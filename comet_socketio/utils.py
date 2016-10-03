"""
Copyright (c) 2016 - Sean Bailey - All Rights Reserved

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""


from django.contrib import messages
from comet_socketio.models import Notification


def check_notifications(request):
    if not request.user.is_authenticated():
        return
    
    notifications = Notification.objects.filter(user=request.user)
    
    for n in notifications:
        messages.add_message(request, n.message_type, n.message)
        n.delete()
