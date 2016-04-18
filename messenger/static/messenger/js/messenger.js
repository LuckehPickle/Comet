/*
 [Messenger] MESSENGER.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 Powered by Django (https://www.djangoproject.com/) - Not endorsed by Django

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

 TODO Rewrite in JQuery
*/

var createGroupTriggers = document.querySelectorAll(".create-group-trigger");
var modal_wrapper = document.querySelector(".modal-wrapper");
var modal_create = document.querySelector(".modal-create");
var easingPath = mojs.easing.path('M0,100 Q0,0 100,0');

var modal_animations = {};

var modal_create_show = new mojs.Tween({
    duration: 250,
    onStart: function(){
        modal_create.setAttribute("data-animating", "");
        modal_wrapper.setAttribute("data-animating", "");
    },
    onUpdate: function(progress){
        modal_create.style.opacity = easingPath(progress);
        modal_wrapper.style.opacity = easingPath(progress);
    },
    onComplete: function(){
        modal_create.removeAttribute("data-animating");
        modal_create.setAttribute("data-enabled", "");
        modal_wrapper.removeAttribute("data-animating");
        modal_wrapper.setAttribute("data-enabled", "");
    },
});

modal_animations["create-show"] = modal_create_show;

var modal_create_hide = new mojs.Tween({
    duration: 300,
    delay: 120,
    onStart: function(){
        modal_create.removeAttribute("data-enabled");
        modal_create.setAttribute("data-animating", "");
        modal_wrapper.removeAttribute("data-enabled");
        modal_wrapper.setAttribute("data-animating", "");
    },
    onUpdate: function(progress){
        modal_create.style.opacity = (1 - easingPath(progress));
        modal_wrapper.style.opacity = (1 - easingPath(progress));
    },
    onComplete: function(){
        modal_create.removeAttribute("data-animating");
        modal_wrapper.removeAttribute("data-animating");
    },
});

modal_animations["create-hide"] = modal_create_hide;

var modal_create_cancel = document.querySelector(".modal-create-cancel");

modal_create_cancel.addEventListener("click", function(){
    toggleModal(modal_create);
});

for(var i = 0; i < createGroupTriggers.length; i++){
    var trigger = createGroupTriggers[i];
    trigger.addEventListener("click", function(){
        toggleModal(modal_create);
    });
}

// Disables
function toggleModal(modal){
    // Make sure a modal was passed
    if(modal.className.indexOf("_modal") == -1){
        return;
    }

    if(!modal.hasAttribute("data-enabled") && !modal.hasAttribute("data-animating")){ // Show modal
        modal_animations[modal.getAttribute("data-animation-id") + "-show"].run();
    }else if(modal.hasAttribute("data-enabled")){ // hide modal
        modal_animations[modal.getAttribute("data-animation-id") + "-hide"].run();
    }
}


/* FRIENDS LIST & GROUPS LIST */
var tab_heads = document.querySelectorAll(".tab-head");
var tab_bodies = document.querySelectorAll(".tab-body");

// Opens whichever tab-head is passed to it.
// TODO Animate changing tabs
function openTab(tab){
    for(var i = 0; i < tab_heads.length; i++){
        tab_heads[i].removeAttribute("active");
        tab_bodies[i].removeAttribute("active");
    }
    tab.setAttribute("active", "");
    document.querySelector(".tab-" + tab.getAttribute("data-tab")).setAttribute("active", "");
    document.cookie
}

// Iterate over each tab to add an event listener
for(var i = 0; i < tab_heads.length; i++){
    tab_heads[i].addEventListener("click", function(event){
        var target = event.target; //Get event target
        //Move up the heirarchy untill we reach the tab-head
        while(!target.hasAttribute("data-tab")){
            target = target.parentElement;
        }
        openTab(target);
    });
}

/* SOCKETIO */
var friends = null;
var groups = null;
var participants = null;

var friends_list = document.querySelectorAll(".tab-body")[0];
var groups_list = document.querySelectorAll(".tab-body")[1];

function updateList(group){
    var list = group ? groups_list : friends_list;
    var data = group ? groups : friends;
    var prefix = group ? "group-" : "friend-";

    // http://stackoverflow.com/a/3955238
    while(list.firstChild){
        list.removeChild(list.firstChild);
    }

    for(var i = 0; i < data.length; i++){
        var item = data[i];

        var container = document.createElement("a");
        container.className = prefix + "container";

        var image = document.createElement("div");
        image.className = prefix + "image";
        container.appendChild(image);

        var username = document.createElement("p");
        username.className = prefix + (group ? "name" : "username");
        username.innerHTML = group ?
            item.fields.name :
            item.fields.username + " (" + String(item.pk).substring(0, 8) + ")";
        container.appendChild(username);

        if(group){
            //TODO Add latest message
            container.href = "/messages/" + item.pk;
        }

        if(!group){
            var status = document.createElement("div");
            status.className = item.fields.is_online ? "friend-status-online" : "friend-status-offline";
            container.appendChild(status);
        }

        list.appendChild(container);
    }
}

$(function(){

    $("#chat-form").submit(function(){
        var message = $("#chat-message").val();
    });

    // Sets a particular users activity state.
    // @parameter data - Data from the incomming packet
    // @parameter active - Is the user active?
    var setActiveFriend = function(data, active){
        if(friends != null){
            for(var i = 0; i < friends.length; i++){
                console.log(friends[i].pk + " " + data.user_id);
                if(friends[i].pk == data.user_id){
                    friends[i].fields.is_online = active;
                    break;
                }
            }
            updateList(false);
        }
    }

    // Handles an incomming friends list
    var handleFriends = function(data){
        friends = JSON.parse(data.json_data);
        updateList(false);
    }

    var handleGroups = function(data){
        groups = JSON.parse(data.json_data);
        updateList(true);
    }

    var addParticipant = function(data, add){
        if(participants != null){
            for(var i = 0; i < participants.length; i++){
                if(participants[i].pk == data.user_id){
                    if(!add){
                        participants[i].remove();
                    }
                    return;
                }
            }
            if(add){
                participants[participants.length] = JSON.parse(data.json_participant);
            }
        }
    }

    var getParticipants = function(){
        if(window.group_id != null)
            socket.send({group_id: window.group_id, action: "participants"});
    }

    var handleParticipants = function(data){
        participants = JSON.parse(data.json_participants);
    }

    var announceSystemMessage = function(data){

    }

    var connected = function(){
        if(window.group_id == null){
            return;
        }
        socket.subscribe("group-" + window.group_id);
        getParticipants();
    };

    var disconnected;

    // Handles general message from client to server
    var messaged = function(data){
        switch(data.action){
            // Friends
            case "friend_connect":
                setActiveFriend(data, true);
                break;
            case "friend_disconnect":
                setActiveFriend(data, false);
                break;
            case "friends":
                handleFriends(data);
                break;
            //Groups
            case "groups":
                handleGroups(data);
                break;
            // Participants
            case "add_participant":
                addParticipant(data, true);
                break;
            case "remove_participant":
                addParticipant(data, false);
                break;
            case "participants":
                handleParticipants(data);
                break;
            // Misc
            case "system_message":
                announceSystemMessage(data);
                break;
            case "message":
                addMessage(data);
                break;
        }
    };

    var start = function(){
        socket = new io.Socket();
        socket.connect();
        socket.on("connect", connected);
        socket.on("disconnect", disconnected);
        socket.on("message", messaged);
    }

    start();
});
