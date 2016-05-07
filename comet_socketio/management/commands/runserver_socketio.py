# [Comet Socketio] RUNSERVER_SOCKETIO.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
# Powered by Django (https://www.djangoproject.com/)
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

from optparse import make_option
from re import match
from thread import start_new_thread
from time import sleep
from os import getpid, kill, environ
from signal import SIGINT

from django.conf import settings
from django.core.handlers.wsgi import WSGIHandler
from django.core.management.base import BaseCommand, CommandError
from django.core.management.commands.runserver import naiveip_re
from django.utils import six
from django.utils.autoreload import code_changed, restart_with_reloader
from socketio.server import SocketIOServer

from comet_socketio import utils


RELOAD = False
DEFAULT_PORT = 8000


def reload_watcher():
    global RELOAD
    while True:
        RELOAD = code_changed()
        if RELOAD:
            kill(getpid(), SIGINT)
        sleep(1)


class Command(BaseCommand):
    option_list = BaseCommand.option_list + (
        make_option(
            '--noreload',
            action='store_false',
            dest='use_reloader',
            default=True,
            help='Do NOT use the auto-reloader.'),
        make_option(
            '--nostatic',
            action='store_false',
            dest='use_static_handler',
            default=True,
            help='Do NOT use staticfiles handler.'),
    )

    def handle(self, addrport='', *args, **options):
        if not addrport:
            self.addr = ''
            self.port = DEFAULT_PORT
        else:
            m = match(naiveip_re, addrport)
            if m is None:
                raise CommandError('"%s" is not a valid port number '
                                   'or address:port pair.' % addrport)
            self.addr, _, _, _, self.port = m.groups()

        environ['DJANGO_SOCKETIO_PORT'] = str(self.port)

        if options.get('use_reloader'):
            start_new_thread(reload_watcher, ())

        try:
            bind = (self.addr, int(self.port))
            print 'SocketIOServer running on %s:%s\n\n' % bind
            handler = self.get_handler(*args, **options)
            server = SocketIOServer(
                bind, handler, resource='socket.io', policy_server=True)
            utils.set_server(server)
            server.serve_forever()
        except KeyboardInterrupt:
            for key, sock in six.iteritems(server.sockets):
                sock.kill(detach=True)
            server.stop()
            if RELOAD:
                print 'Reloading...\n\n'
                restart_with_reloader()

    def get_handler(self, *args, **options):
        """
        Returns the django.contrib.staticfiles handler.
        """
        handler = WSGIHandler()
        try:
            from django.contrib.staticfiles.handlers import StaticFilesHandler
        except ImportError:
            return handler
        use_static_handler = options.get('use_static_handler')
        insecure_serving = options.get('insecure_serving', False)
        if (settings.DEBUG and use_static_handler or
                (use_static_handler and insecure_serving)):
            handler = StaticFilesHandler(handler)
        return handler
