# [FrontPage] VIEWS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django.shortcuts import render
from django.contrib import messages

# Messenger Imports
from comet import Modal

# Other Imports
import cr_config

# FRONTPAGE
# Currently just renders the front page from the template.
def index(request):
    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]
        # TODO requires Socket connection - notify.check_notifications(request)

    modals = []
    modals.append(Modal(
        title="connecting",
        foreground="comet_socketio/modal_connecting.html",
        background="comet_socketio/modal_connecting_background.html",
    ))

    return render(request, "frontpage/index.html", {
        "title": cr_config.TITLE,
        "user_id": user_id,
        "modals": modals,
    })
