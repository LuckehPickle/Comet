
from django.conf.urls import patterns, url
from . import views

urlpatterns = [
    url(r'^$', views.rooms, name="rooms"),
    url(r'^create/$', views.create, name="create_test"),
    url(r'^system_message/$', views.system_message, name="system_message"),
    url(r'^(?P<slug>.*)$', views.room, name="room"),
]
