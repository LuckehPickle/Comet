# [ChatProject] URLS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
#
# https://docs.djangoproject.com/en/1.9/topics/http/urls/

# Django Imports
from django.conf.urls import include, url
from django.contrib import admin

# Socketio Imports
import socketio.sdjango
socketio.sdjango.autodiscover()

# Other Imports
from accounts import views as accounts
from frontpage import views as front
from frontend_utils import views as frontend_utils

# URL Patterns
urlpatterns = [
    url(r'^$', front.index, name="frontpage"),
    url(r'^register', accounts.register, name="register"),
    url(r'^login', accounts.login, name="login"),
    url(r'^logout', accounts.logout, name="logout"),
    url(r'^messages/', include("messenger.urls")),
    url(r'^chat-test/', include("chat_test.urls")),
    url(r'^socket\.io/', include(socketio.sdjango.urls)),
    url(r'^front', frontend_utils.index, name="front"),
    url(r'^admin/', admin.site.urls),
]
