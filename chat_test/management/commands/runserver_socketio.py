# [ChatTest] RUNSERVER_SOCKETIO.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
# ISSUE: Syntax Error in SocketIOServer ln 108.
# Atleast thats what the stacktrace says. This surely must be something I
# have done wrong...

# Django Imports
from django.conf import settings
from django.core.handlers.wsgi import WSGIHandler
from django.core.management.base import BaseCommand, CommandError
from django.core.management.commands.runserver import naiveip_re#, DEFAULT_PORT
from django.utils.autoreload import code_changed, restart_with_reloader

# Socketio Imports
from socketio.server import SocketIOServer

# Other Imports
from re import match
from thread import start_new_thread
from time import sleep
from os import getpid, kill, environ
from signal import SIGINT

RELOAD = False
DEFAULT_PORT = '8000'

def reload_watcher():
    global RELOAD
    while True:
        RELOAD = code_changed()
        if RELOAD:
            kill(getpid(), SIGINT)
        sleep(1)

class Command(BaseCommand):
    # get_handler(self, *args, **kwards)
    # Returns the django.contrib.staticfiles handler.
    def get_handler(self, *args, **kwargs):
        handler = WSGIHandler()
        try:
            from django.contrib.staticfiles.handlers import StaticFilesHandler
        except ImportError:
            return handler
        use_static_handler = options.get("use_static_handler", True)
        insecure_serving = options.get("insecure_serving", False)
        if (settings.DEBUG and use_static_handler) or (use_static_handler and insecure_serving):
            handler = StaticFilesHandler(handler)
        return handler

    # handle(self, [addrport, *args, **kwargs])
    # As you may guess, this function handles the command.
    def handle(self, addrport="", *args, **kwargs):
        if not addrport:
            self.addr = ""
            self.port = DEFAULT_PORT
        else:
            m = match(naiveip_re, addrport)
            if m is None:
                raise CommandError("'%s' is not a valid port number or address:port pair." % addrport)
            self.addr, _, _, _, self.port = m.groups()

        environ["DJANGO_SOCKETIO_PORT"] = str(self.port)

        start_new_thread(reload_watcher, ())
        try:
            bind = (self.addr, int(self.port))
            print()
            print("SocketISServer running on %s:%s" % bind)
            print()
            handler = self.get_handler(*args, **kwargs)
            server = SocketIOServer(bind, handler, resource="socket.io", policy_server=True)
            server.serve_forever()
        except KeyboardInterrupt:
            if RELOAD:
                server.stop()
                print("Reloading...")
                restart_with_reloader()
            else:
                raise
