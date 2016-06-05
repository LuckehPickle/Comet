from socketio.sgunicorn import GeventSocketIOWorker

class MyGeventSocketIOWorker(GeventSocketIOWorker):
    """
    Workaround for an incompatibility between Gevent-SocketIO and
    Gunicorn. See here for more details: (ant9000's comment)
        https://github.com/abourget/gevent-socketio/issues/199
    """
    policy_server = False
