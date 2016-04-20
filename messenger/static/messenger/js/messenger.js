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
 TODO Redo modal handling
 TODO User search modal
*/

var modal_wrapper = document.querySelector(".modal-wrapper");
var modal_create = document.querySelector(".modal-create");
var createGroupTriggers = document.querySelectorAll(".create-group-trigger");
var easingPath = mojs.easing.path('M0,100 Q0,0 100,0');

var modal_animations = {};

modal_animations["create-show"] = new mojs.Tween({
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

modal_animations["create-hide"] = new mojs.Tween({
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
var tab_footers = document.querySelectorAll(".tab-footer");

// Opens whichever tab-head is passed to it.
// TODO Animate changing tabs
function openTab(tab){
    for(var i = 0; i < tab_heads.length; i++){
        tab_heads[i].removeAttribute("active");
        tab_bodies[i].removeAttribute("active");
    }
    tab.setAttribute("active", "");
    document.querySelector(".tab-" + tab.getAttribute("data-tab")).setAttribute("active", "");
    document.cookie = "tab=" + tab.getAttribute("data-tab") + ";path=/messages";
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

/* Search bar */
$(".tools-input-wrapper:not([active]) > i").on("click", function(){
    $(".tools-input-wrapper > input").focus();
});

$(".tools-input-wrapper:not([active]) > input").on("focus", function(){
    $(".tools-input-dropdown").hide();
    $(this).parent().attr("active", "");
    $(this).select();
    setTimeout(function(){
        $(".tools-input-dropdown").slideDown(200);
    }, 300);
});

$("html").on("click", function(event){
    if(!$(event.target).closest(".tools-input-wrapper").length && !$(event.target).is(".tools-input-wrapper")){
        if($(".tools-input-wrapper")[0].hasAttribute("active")){
            $(".tools-input-wrapper").removeAttr("active");
            $(".tools-input-dropdown").hide();
        }
    }
});

/* SOCKETIO */

$(function(){
    var socket_type = {
        NONE: 0,
        USER: 1,
        GROUP: 2,
    }

    var SOCKET_TYPE = socket_type.NONE;
    if(window.group_id != null){
        SOCKET_TYPE = socket_type.GROUP;
    }else if(window.user_url != null){
        SOCKET_TYPE = socket_type.USER;
    }

    $("[data-url]").on("click", function(){
        window.location.href = $(this).attr("data-url");
    });

    var typing_timer;
    var done_typing_interval = 500;
    var $input = $(".tools-input-wrapper > input");

    $input.on("keyup", function(){
        clearTimeout(typing_timer);
        typing_timer = setTimeout(doneTyping, done_typing_interval);
    });

    $input.on("keydown", function(){
        clearTimeout(typing_timer);
    });

    function doneTyping(){
        requestQueryResponse($input.val());
    }

    var requestQueryResponse = function(query){
        if(query != "" && query != null && query.length >= 3){
            console.log("Searching for users named '" + query + "'");
            socket.send({action: "search", data: query, group_id: window.group_id});
        }
    }

    var handleQueryResponse = function(data){
        console.log("Response received.");
        var users = JSON.parse(data.users);
        var friends = data.friends;
        updateSearchList(users, friends);
    }

    function updateSearchList(data, friends){
        clearSearchList();
        if(data.length == 0){ // No data returned (ie Empty result)
            $(".dropdown-users").append("<p class=\"dropdown-no-results\">No results found.</p>");
            return;
        }

        jQuery.each(data, function(){
            var user_type = "<i class=\"material-icons\">add</i> Add";
            var class_type = "add";

            if(this.pk in friends){
                switch(friends[this.pk]){
                    case "friend":
                        user_type = "Friends";
                        class_type = "friend";
                        break;
                    case "request_sent":
                        user_type = "Request Sent";
                        class_type = "sent";
                        break;
                    case "request_received":
                        user_type = "Accept Request";
                        class_type = "request";
                        break;
                }
            }

            $(".dropdown-users").append(
            "<div class=\"dropdown-results-container\">" +
                "<div class=\"dropdown-result-image\"></div>" +
                "<section>" +
                    "<p class=\"dropdown-result-username\">" + this.fields.username + " (" + this.pk.substring(0, 8).toUpperCase() + ")</p>" +
                    "<p class=\"dropdown-result-tags\">Beta Tester</p>" +
                "</section>" +
                "<div class=\"dropdown-result-button-" + class_type + "\" data-user-id=" + this.pk + " data-user-url=" + this.fields.user_url + ">" + user_type + "<link class=\"rippleJS\"/></div>" +
                //"<link class=\"rippleJS\"/>" +
            "</div>");
        });

        $(".dropdown-result-button-add").on("click", function(){
            sendFriendRequest($(this).attr("data-user-id"));
            requestQueryResponse($(".tools-input-wrapper input").val());
        });

        $(".dropdown-result-button-request").on("click", function(){
            sendFriendRequest($(this).attr("data-user-id"));
            requestQueryResponse($(".tools-input-wrapper input").val());
        });

        $(".dropdown-results-container").on("click", function(){
            var child_elem = $(this).find(".dropdown-result-button-friend");
            if(child_elem.length != 0){
                window.location.href = "/messages/user/" + child_elem.attr("data-user-url");
            }
        });
    }

    function clearSearchList(){
        $(".dropdown-users").children(":not(.dropdown-title)").each(function(){
            $(this).remove();
        });
    }

    var sendFriendRequest = function(user_id){
        socket.send({action: "friend_req", user_id: user_id, group_id: window.group_id});
        console.log("Friend request sent to user '" + user_id + "'");
    }

    /**
     * Handles incoming pmessages in the same way that a database stored
     * pmessage would be handled.
     */
    var handlePMessage = function(data){
        console.log("Received pmessage of type '" + data.type + "'");
        $(".pmessages").append(
            "<div class=\"pmessage-container pmessage-container-" + data.type + "\" data-new>" +
                "<svg class=\"pmessage-close pmessage-close-" + data.type + "\" viewBox=\"0 0 20 20\">" +
                    "<path d=\"M0 3 L3 0 L10 7 L17 0 L20 3 L13 10 L20 17 L17 20 L10 13 L3 20 L0 17 L7 10 z\">" +
                "</svg>" +
                "<p class=\"pmessage pmessage-" + data.type + "\">" + data.message + "</p>" +
            "</div>"
        );

        $(".pmessage-container[data-new]").children()[0].addEventListener("click", closeListener);
        $(".pmessage-container[data-new]").removeAttr("data-new");
    }

    /**
     * Handles the submit function on the chat form.
     */
    $(".chat-form").submit(function(){
        input = $(".chat-form-input");
        sendMessage(input.text());
        input.text("");
        return false; // Lets the VM now we've handled the event
    });

    /**
     * Handles the 'send' button click event.
     */
    $(".chat-send").on("click", function(){
        $(".chat-form").submit();
    });

    /**
     * Handles 'enter' key presses on the contenteditable div.
     * Note: If the user presses 'ctrl+enter' then the form should
     * not be submitted, rather a new line should be inserted.
     */
    $(".chat-form-input").on("keydown", function(event){
        if(event.which == 13){
            $(".chat-form").submit();
            return false;
        }

        // Make sure the key pressed wasn't delete
        if(event.which != 8 && $(".chat-form-input").text().length > 256){
            $(".chat-form-input").text($(".chat-form-input").text().substring(0, 256));
        }
    });

    /**
     * Sends a message through the socket to be sent to all other connected
     * sockets.
     */
    var sendMessage = function(message){
        if(message == null || message == ""){
            console.log("cancelled " + message);
            return;
        }

        var data = {
            action: "message",
            message: message,
        }

        if(SOCKET_TYPE == socket_type.GROUP){
            data["group_id"] = window.group_id;
        }else if(SOCKET_TYPE == socket_type.USER){
            data["user_url"] = window.user_url;
        }

        socket.send(data);
        console.log("Message sent");
    }

    /**
     * Handles incomming messages.
     */
    var handleMessage = function(data){
        console.log(data["message"]);
    }

    var connected = function(){
        if(window.group_id != null){
            socket.subscribe("group-" + window.group_id);
            console.log("Subscribing to group-" + window.group_id);
        }else if(window.user_url != null){
            socket.subscribe("user-" + window.user_url);
            console.log("Subscribing to user-" + window.user_url);
        }
    };

    var disconnected;

    // Handles general message from client to server
    var messaged = function(data){
        switch(data.action){
            case "search":
                handleQueryResponse(data);
                break;
            case "pmessage":
                handlePMessage(data);
                break;
            case "message":
                handleMessage(data);
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
