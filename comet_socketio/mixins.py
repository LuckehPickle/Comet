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

class ChannelMixin(object):

    def join(self, channel_id):
        """
        """
        pass


    def leave(self, channel_id):
        """
        """
        pass


    def kick(self, channel_id, user_id):
        """
        """
        pass


    def ban(self, channel_id, user_id, reason):
        """
        """
        pass


    def get_channel_name(self, channel_id):
        pass
