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

    if(!$(event.target).closest(".tool-container").length && !$(event.target).is(".tool-container")){
        $(".tool-container-dropdown").hide();
    }
});

/**
 * Handles tool container dropdown clicks.
 */
$(".tool-container").on("click", function(event){
    if(!$(event.target).closest(".tool-container-dropdown").length && !$(event.target).is(".tool-container-dropdown")){
        $(this).children(".tool-container-dropdown").slideDown(200);
    }
});

$(".tool-container-dropdown").on("click", function(){
    $(this).hide();
});

$(function(){
    // Scroll to bottom on load
    $(".chat-body").animate({
        scrollTop: $(".chat-body").prop("scrollHeight")
    }, 300);

    /**
     * Essentially turns DIV's with a 'data-url' attribute into links.
     * TODO Find a way to remove this so that users can open in new tab.
     * If it is removed currently, the JS Ripple will be link coloured in
     * a hideous explosion of colour.
     */
    $("[data-url]").on("click", function(){
        window.location.href = $(this).attr("data-url");
    });

    /**
     * Handles the typing timeout. Each time a key is pressed the timer
     * is reset.
     */
    var typing_timer;
    var DONE_TYPING_INTERVAL = 500;
    var $input = $(".tools-input-wrapper > input");

    /**
     * Listens for 'keyup' events to reset the typing typing_timer
     */
    $input.on("keyup", function(){
        clearTimeout(typing_timer);
        typing_timer = setTimeout(doneTyping, DONE_TYPING_INTERVAL);
    });

    /**
     * Clears the  timer but doesn't restart it, as the key is still pressed.
     */
    $input.on("keydown", function(){
        clearTimeout(typing_timer);
    });

    /**
     * Function which runs whenever the typing timer runs out. It essentially
     * means the user has finished typing.
     */
    function doneTyping(){
        requestQueryResponse($input.val());
    }

    /**
     * Request a response to the search query. The request is sent via
     * Socket IO.
     */
    var requestQueryResponse = function(query){
        if(query != "" && query != null && query.length >= 3){
            console.log("Searching for users named '" + query + "'");
            socket.send({
                action: "search",
                data: query,
                channel_id: window.channel_id,
                is_group: window.is_group,
            });
        }
    }

    /**
     * Handles incoming query responses from the Socket IO server.
     */
    var handleQueryResponse = function(data){
        console.log("Response received.");
        var users = JSON.parse(data.users);
        var friends = data.friends;
        updateSearchList(users, friends);
    }

    /**
     * Updates the search list with new data, removing stale data as well.
     */
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
        // TODO fix
        if(event.which != 8 && $(".chat-form-input").text().length > 256){
            $(".chat-form-input").text($(".chat-form-input").text().substring(0, 256));
        }
    });

    /**
     * Sends a message to the Socket IO server. To be sent to all other sockets.
     */
    var sendMessage = function(message){
        if(message == null || message == ""){
            return;
        }

        handleMessage({
            message: message,
            sender: window.username,
            sender_id: window.user_id,
            time_sent: Date.now(),
            local: true,
        });

        socket.send({
            action: "message",
            message: message,
            channel_id: window.channel_id,
            is_group: window.is_group,
        });
        console.log("Message sent");
    }

    /**
     * Handles a message. Accepts either a dict or a string and creates
     * a message element in the chat body.
     * TODO Check the time period. If > 5 mins do not tag.
     * TODO Clean up
     */
    var handleMessage = function(data){
        // Check the most recent message to see if we can tag
        var most_recent = $(".chat-body").children().last();
        var other = (data.sender_id == window.user_id) ? "" : "-other";
        var time = new Date(data.time_sent).toLocaleTimeString(navigator.language, {
            hour: "numeric",
            minute: "numeric",
            hour12: false,
        });

        $(".no-messages").remove();

        if(most_recent.attr("data-user-id") == data.sender_id){
            // A new message from the same user. We can safely tag.
            most_recent.children(".chat-message-sender" + other).remove();
            most_recent.append(
                "<p class=\"chat-message-sender" + other + "\">" + data.sender + " (" + time + ")</p>"
            );

            // Add the tag message
            most_recent.children("section").append("<div class=\"chat-message-content" + other + "-tag\" data-new></div>");
        }else{
            // From a new user, append.
            $(".chat-body").append(
                "<div class=\"chat-message-container" + other + "\" data-user-id=\"" + data.sender_id + "\">" +
                    "<div class=\"chat-message-image" + other + "\"></div>" +
                    "<span class=\"triangle-top-" + (other ? "right" : "left") + "\"></span>" +
                    "<section>" +
                        "<div class=\"chat-message-content" + other + "\" data-new></div>" +
                    "</section>" +
                    "<p class=\"chat-message-sender" + other + "\">" + data.sender + " (" + time + ")</p>" +
                "</div>"
            );
        }

        // Add the message afterwards via .text() to escape HTML
        $messageContent = $("[class^=\"chat-message-content\"][data-new]");
        $messageContent.text(data.message);
        $messageContent.removeAttr("data-new");

        // Make sure that the body is scrolled to the bottom
        $(".chat-body").animate({
            scrollTop: $(".chat-body").prop("scrollHeight")
        }, 300);
    }

    /**
     * Automatically subscribes this Socket to the appropriate channel.
     */
    var connected = function(){
        if(window.channel_id != null){
            if(window.is_group){
                socket.subscribe("group-" + window.channel_id);
                console.log("Subscribing to group-" + window.channel_id);
            }else{
                socket.subscribe("user-" + window.channel_id);
                console.log("Subscribing to user-" + window.channel_id);
            }
        }
    };

    /**
     * Announces when a new user joins a group.
     */
    var announceUserJoin = function(data){
        $(".chat-body").append("<p class=\"user-join\">" + data.username + " has joined the group.</p>")
        console.log(data.username + " has joined the group.");
    }

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
            case "message_sent":

                break;
            case "user_join":
                announceUserJoin(data);
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
