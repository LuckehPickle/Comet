# [Comet] __INIT__.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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


class Modal():
    """
    References a modal for use inside of Django's templates.
        modals = []
        modals.append(new Modal(title, foreground, background))
    """

    def __init__(self, title, foreground, background):
        """
        Initialises a modal
        """
        self.title = title
        self.foreground = foreground
        self.background = background


    def __unicode__(self):
        return str(self.title)
