# [Comet] URLS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django.conf.urls import include, url

# Socketio Imports
import socketio.sdjango
socketio.sdjango.autodiscover()

# Other Imports
from accounts import views as accounts
from frontpage import views as front
from comet import views as comet


# URL Patterns
urlpatterns = [
    url(r'^$', front.index, name="frontpage"),
    url(r'^register', accounts.register, name="register"),
    url(r'^login', accounts.login, name="login"),
    url(r'^logout', accounts.logout, name="logout"),
    url(r'^messages/', include("messenger.urls")),
    url(r'^docs/', include("docs.urls")),
    url(r'^socket\.io', include(socketio.sdjango.urls)),

    # url(r'^400', comet.bad_request, name="400"),
    # url(r'^403', comet.permission_denied, name="403"),
    # url(r'^404', comet.page_not_found, name="404"),
    # url(r'^500', comet.server_error, name="500"),
]

# Error Handlers
# handler400 = 'comet.views.bad_request'
# handler403 = 'comet.views.permission_denied'
# handler404 = 'comet.views.page_not_found'
# handler500 = 'comet.views.sever_error'
