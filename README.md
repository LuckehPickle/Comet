# chat
This is my first major project, so please excuse any major mistakes in the source code. Source code for a project. More info when closer to release.

There are several tests hosted with GitHub pages at [chat-tests](https://github.com/LuckehPickle/chat-tests#chat-tests) if you're interested.

![Spoopy](http://i.imgur.com/hbEh3VV.png "Spoopy")

# Technologies
__Frontend:__
* [Mo.js](http://mojs.io/) - Javascript Motion Library
* [JQuery]() - Javascript Framework
* [Asual JQuery Address](http://www.asual.com/jquery/address/) - Deep Linking for JQuery

__Backend:__
* [Django](https://www.djangoproject.com/) - Python Web Framework
* [gevent](http://www.gevent.org/) - Python Networking Library
* [greenlet](https://pypi.python.org/pypi/greenlet) - Concurrency, and a dependency of gevent.
* [gevent-websocket](https://pypi.python.org/pypi/gevent-websocket/) - Websockets for gevent
* [gevent-socketio](https://github.com/abourget/gevent-socketio) - Socket.io Implementation for gevent

__Note:__ In order to use gevent-socketio with Python 3.X you must fix some source code in the socketio python package. These are the changes I made for Python 3.5.1: (Note: some people have added python 3 compatibility, but their pull requests are being ignored. The entire repo hasn't been updated in some time.)
* __socketio.server__ 
  * line 108 "except error, ex:" ==> "except error as ex:"
* __socketio.handler__ 
  * line 4 "import urlparse" ==> "from urllib import parse"
* __socketio.transports__ 
  * line 3 "import urlparse" ==> "from urllib import parse"
* __socketio.virtsocket__ 
  * line 365 "except (ValueError, KeyError, Exception), e:" ==> "except (ValueError, KeyError, Exception) as e:"
* __socketio.packet__ 
  * line 156 "except ValueError, e:" ==> "except ValueError as e:"
  * line 15, 23 & 29 "x.iteritems()" ==> "x.items()"
