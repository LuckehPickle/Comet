# [Comet Socketio] MIXINS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

from accounts.models import User

class ChannelMixin(object):

    def emit_to_channel(self, channel_id, event, *args):
        """
        Emits to every socket in the channel
        """
        pkt = dict(type="event",
                   name=event,
                   args=args,
                   endpoint=self.ns_name)
        for sessid, socket in six.iteritems(self.socket.server.sockets):
            user = User.objects.get(socket_session=sessid)
            channel

            if 'rooms' not in socket.session:
                continue
            if room_name in socket.session['rooms'] and self.socket != socket:
                socket.send_packet(pkt)
