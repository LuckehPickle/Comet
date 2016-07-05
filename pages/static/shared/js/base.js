/**
 * @license Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Looking for source code? Check it out here: https://github.com/LuckehPickle/Comet
 */

/**
 * Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/** @const */ var DEBUG = true;
var connectingModal;


/**
 * Init
 * Initialises the entire web page.
 * @param {Boolean} fullLoad Determines whether the page was a PJAX load.
 */
function init(fullLoad){
    if(connectingModal == null)
        connectingModal = new Modal("connecting", $(".modal-connecting"));

    if(!fullLoad){ // If this is a PJAX load we only want to add event handlers.
        addEventListeners(fullLoad);
        return;
    }

    print("Initialising base...");

    initSocket();
    addEventListeners(fullLoad);
    $("div[class^='push-message-container']").fadeIn(300);
    if(!DEBUG)
        printWarning();

    print("Initialised Base.");
}


/**
 * Add Event Listeners
 * To be run at each page load, initialises any event listeners.
 * @param {Boolean} page Is this a page load?
 */
function addEventListeners(fullLoad){
    /* BEGIN PJAX */
    $(document).off(".base");
    $(document).pjax("a[data-pjax]", ".pjax-body");
    $(document).pjax("a[data-pjax-m]", ".chat-right");
    $(document).on("pjax:start.base", function(){ NProgress.start();});
    $(document).on("pjax:end.base",   function(){ NProgress.done();});
    NProgress.configure({ showSpinner: false });
    /* END PJAX */

    if(fullLoad){
        /* BEGIN PUSH MESSAGES */
        var pushMessages = $("[class^='push-message-close'], [class^='button-request-']");
        pushMessages.off(".base");
        pushMessages.on("click.base", function(){
            // TODO Handle messages from Django
            print("failure", true);
        });

        var pushMessageButton = $("[class^=\"button-request-\"][data-user-id]");
        pushMessageButton.off(".base");
        pushMessageButton.on("click.base", function(event){
            var accept = $(this).is("[class*='-accept']");
            answerFriendRequest(accept, $(this).attr("data-user-id"));
        });
        /* END PUSH MESSAGES */
    }

    /* BEGIN MODALS */
    var bgify = $(".bgify");
    bgify.off(".base");
    bgify.on("click.base", function(){
        connectingModal.hide(); // TODO Add some way to let the user know its still connecting
    });
    /* END MODALS */

    /* BEGIN DROPDOWN */
    var dropdownTrigger = $(".dropdown-trigger[data-dropdown-id]");
    dropdownTrigger.off(".base");
    dropdownTrigger.on("click.base", function(){
        var dropdown = $(".dropdown[data-dropdown-id='" + $(this).attr("data-dropdown-id") + "']");

        if(dropdown.is("[active]")){
            dropdown.slideUp(150, function(){
                dropdown.hide();
                dropdown.removeAttr("active");
            });
            return;
        }

        $(".dropdown").hide();
        $(".dropdown").removeAttr("active");
        dropdown.slideDown(200);
        dropdown.attr("active", "");
    });

    var navTrigger = $(".mobile-nav-trigger");
    navTrigger.off(".base");
    navTrigger.on("click.base", function(){
        var navigation = $(".navigation-menu");
        if(navigation.is("[active]")){
            navigation.removeAttr("active");
        }else{
            navigation.attr("active", "");
        }
    });
    /* END DROPDOWN */

    /* BEGIN NAV DROPDOWN */
    var navDropdown = $(".nav-dropdown");
    navDropdown.off(".base");
    navDropdown.on("click.base", function(){
        if(navDropdown.is("[active]")){
            navDropdown.removeAttr("active");
        }else{
            navDropdown.attr("active", "");
        }
    });
    /* END NAV DROPDOWN */

    /* BEGIN SEARCH */
    var searchInput = $(".docs-search input");
    searchInput.off(".base");
    searchInput.on("keyup.base", function(){
        clearTimeout(typing_timer);
        typing_timer = setTimeout(searchTypingComplete, DONE_TYPING_INTERVAL);
    });
    searchInput.on("keydown.base", function(){
        clearTimeout(typing_timer);
    });

    var searchIcon = $(".docs-search:not([active]) i");
    searchIcon.off(".base");
    searchIcon.on("click.base", function(){
        searchInput.focus();
    });

    // No need to remove events here, it was done above
    $(".docs-search:not([active]) input").on("focus.base", function(){
        $(".docs-search-dropdown").hide();
        $(this).parent().attr("active", "");
        $(this).select();
        $(".docs-search-dropdown").slideDown(200);
    });
    /* END SEARCH */

    /* BEGIN FOOTER */
    var footerTitles = $(".footer-wrapper section p");
    footerTitles.off(".base");
    footerTitles.on("click.base", function(){
        if($(this).is("[active]")){
            $(this).removeAttr("active");
            $(this).next().removeAttr("active");
        }else{
            $(this).attr("active", "");
            $(this).next().attr("active", "");
        }
    });
    /* END FOOTER */

    $("html").off(".base");
    $("html").on("click.base", handleDocumentEvent);
};


/**
 * Handle Document Event
 * Click event that always fires.
 */
function handleDocumentEvent(event){
    var target = $(event.target);

    /* BEGIN NAVIGATION */
    if($(".navigation-menu").is("[active]")){
        if(!target.closest(".mobile-nav-trigger").length && !target.is(".mobile-nav-trigger")){
            $(".navigation-menu").removeAttr("active");
        }
    }
    /* END NAVIGATION */

    /* BEGIN DROPDOWN */
    if($(".dropdown").is("[active]")){
        if(!target.closest(".dropdown-trigger").length && !target.is(".dropdown-trigger")){
            var dropdown = $(".dropdown");
            dropdown.slideUp(150, function(){
                dropdown.hide();
                dropdown.removeAttr("active");
            });
        }
    }
    /* END DROPDOWN */

    /* BEGIN NAV DROPDOWN */
    if($(".nav-dropdown").is("[active]")){
        if(!target.closest(".nav-dropdown").length && !target.is(".nav-dropdown")){
            $(".nav-dropdown").removeAttr("active");
        }
    }
    /* END NAV DROPDOWN */

    /* BEGIN SEARCH */
    if(!$(event.target).closest(".search, .docs-search").length && !$(event.target).is(".search, .docs-search")){
        if($(".search, .docs-search").is("[active]")){
            $(".search-dropdown, .docs-search-dropdown").slideUp(200, function(){
                $(".search, .docs-search").removeAttr("active");
            });
        }
    }
    /* END SEARCH */
}


$(document).on("pjax:success", function(){
    init(false);
});

$(document).on("ready", function(){
    init(true);
});


/* BEGIN UTILS */
/**
 * indexOfEnd
 * http://stackoverflow.com/a/18893403/5658441
 * @return {number} Gets the index of the end of a substring
 */
String.prototype.indexOfEnd = function(string) {
    var io = this.indexOf(string);
    return io == -1 ? -1 : io + string.length;
}


/**
 * Print
 * Formats and outputs a string to the console. Only works in
 * debug mode.
 *
 * @param {string} out Message to output
 * @param {boolean} error Show as an error
 */
function print(out, error){
    if(!DEBUG)
        return;

    var date = new Date();
    var message = "[" + date.getHours() + ":" + date.getMinutes() + "] [Comet] " + out;
    if(error){
        console.error(message);
        return;
    }
    console.log(message);
}


/**
 * Send
 * Sends data to the socket server.
 * @param {String} eventType Event to fire
 * @param {Object} data Data to send to server
 */
function send(eventType, data){
    if(!connected){
        queue.push({
            eventType: eventType,
            value: data,
        });
        return;
    }

    if(data == null){
        socket.emit(eventType);
        return;
    }
    socket.emit(eventType, data);
}


/**
 * Check Queue
 * Checks to see if any data is sitting in the Queue, and sends it to
 * the socket server.
 */
function checkQueue(){
    if(queue.length > 0 && connected){
        for(var i = 0; i < queue.length; i++){
            var item = queue[i];
            if(item["value"] == null){
                socket.emit(item["eventType"]);
                continue;
            }
            socket.emit(item["eventType"], item["value"]);
        }
        print("Emptied socket queue.");
    }
}


/**
 * Scroll To Bottom
 * Scrolls the element to the bottom.
 * @param {Object} object JQuery Element to scroll
 */
function scrollToBottom(object){
    object.animate({
        scrollTop: object.prop("scrollHeight")
    }, 300);
}


/**
 * Set Debug
 * Toggles or sets debug mode.
 * @param {Boolean} debug Should the page be set to debug mode.
 */
function setDebug(debug){
    if(typeof debug === "undefined"){
        DEBUG = !DEBUG;
    }else{
        DEBUG = debug;
    }

    if(!DEBUG){
        console.clear();
        printWarning();
    }
}


/**
 * Print Warning
 * Prints a wanring to the console.
 */
function printWarning(){
    console.log("");
    console.log("%cHold on a second!", "font-size:25px; font-family: 'Roboto', sans-serif;");
    console.log("%cThis console is intended for developers.", "font-size:16px; font-family: 'Roboto', sans-serif;");
    console.log("%cDo not enter anything here unless you know what you're doing.", "font-size:16px; font-family: 'Roboto', sans-serif;");
    console.log("%cFor more information on the dangers of this console, see http://cometchat.cc/docs/update-this", "font-size:16px; font-family: 'Roboto', sans-serif;");
    console.log("");
}
/* END UTILS */


/* BEGIN PUSH MESSAGES */
/**
 * Message Types
 * Enum for push message types. This essentially allows the creation of
 * push messages that are compatible with Django's messaging framework.
 * https://git.io/vwgcG
 * @enum {number}
 */
var MessageType = {
    DEBUG: 10,
    INFO: 20,
    SUCCESS: 25,
    WARNING: 30,
    ERROR: 40,
}


/**
 * Push Message
 * @param {number} type Type of push message. Refer to MessageType enum
 * @param {string} message Message to display inside the push message
 * @param {Boolean} display Should the message be displayed automatically (optional)
 */
var PushMessage = function(type, message, display){
    this.type = type;
    this.message = message;
    if(display != false){
        this.display();
    }
};


/**
 * Display
 * Displays and initialises the push message in the DOM.
 */
PushMessage.prototype.display = function(){
    var instance = this;
    if(instance.element != null){
        return;
    }

    $(".push-messages").append(
        "<div class=\"push-message-container-" + this.type + "\" data-new>" +
            "<svg class=\"push-message-close-" + this.type + "\" viewBox=\"0 0 20 20\">" +
                "<path d=\"M0 3 L3 0 L10 7 L17 0 L20 3 L13 10 L20 17 L17 20 L10 13 L3 20 L0 17 L7 10 z\">" +
            "</svg>" +
            "<p class=\"push-message-content-" + this.type + "\">" + this.message + "</p>" +
        "</div>"
    );

    var container = $("[class^='push-message-container'][data-new]");
    container.fadeIn(300);
    container.removeAttr("data-new");
    this.element = container;

    $("[class^='push-message-close']").off(".push");
    $("[class^='push-message-close']").on("click.push", function(){
        instance.remove();
    });

    print("Push message of type '" + this.type + "' created.");
};


/**
 * Remove
 * Removes/deletes this Push Message.
 */
PushMessage.prototype.remove = function(){
    var instance = this;
    instance.element.slideUp(200, function(){
        instance.element.remove();
        instance.element = null;
        print("Push message closed.");
    });
};
/* END PUSH MESSAGES */


/* BEGIN MODALS */
var modalQueue = [];

/**
 * Modal
 * @param {String} title Modal title.
 * @param {Object} element JQuery element of the modal.
 */
var Modal = function(title, element){
    this.title = title;
    this.element = $(element);
};


/**
 * Display Modal
 * Attempts to show the modal.
 * @param {boolean} foreground Force the modal to the foreground.
 */
Modal.prototype.display = function(foreground){
    if(this.element.is("[active]"))
        return;

    if(foreground || modalQueue.length == 0){
        // Queue the active modal (if any).
        if(modalQueue.length != 0)
            modalQueue[0]._queue();

        // Display modal wrapper if necessary.
        if(!$(".modals").is("[active]")){
            $(".modals").fadeIn(300);
            $(".modals").attr("active", "");
            $("body").addClass("modal-open");
        }

        // Display modal.
        this.element.fadeIn(300);
        this.element.attr("active", "");
        modalQueue.unshift(this); // Put this modal at the front of the queue.

        print("Displaying modal titled '" + this.title + "'.");
    }else{
        // Add this modal to the end of the queue.
        modalQueue.push(this);
        print("Queuing modal titled '" + this.title + "'.");
    }
};


/**
 * Queue Modal (Interal)
 * Not to be accessed externally, hides the modal for queuing.
 */
Modal.prototype._queue = function(){
    if(this.element.is("[active]")){
        this.element.hide(100);
    }
};


/**
 * Hide Modal
 * Hides the modal.
 */
Modal.prototype.hide = function(){
    if(this.element.is("[active]")){
        // Remove modal from queue.
        modalQueue.shift();

        // Hide modal wrapper if there are no other modals.
        if(modalQueue.length == 0){
            $("body").removeClass("modal-open");
            $(".modals").fadeOut(300, function(){
                $(this).removeAttr("active");
            });
        }

        // Hide modal.
        this.element.fadeOut(300, function(){
            $(this).removeAttr("active");
            if(modalQueue.length != 0)
                modalQueue[0].display(); // Display queued modal.
        });

        print("Hiding modal titled '" + this.title + "'.");
    }
};
/* END MODALS */


/* BEGIN SOCKETS */
/** @const */ var CONNECTION_ERROR_DELAY = 300;
var socket; // A reference to the Socket IO socket.
var connected = false;
var connectionTimer; // Tracks the time it's taken to connect
var connectingModal;
var queue = [];


/**
 * Init Socket
 * Attempts to open a connection with the socket server, but only if the
 * user is logged in.
 */
function initSocket(){
    if(window.user_id != null){
        openSocketConnection();
    }
};


/**
 * Open Connection
 * Attempts to open a connection with the socket server
 */
function openSocketConnection(){
    print("Connecting to socket server...");
    socket = io.connect("/messenger");
    socket.on("connect", handleSocketConnect);
    socket.on("disconnect", handleSocketDisconnect);
    socket.on("message", handleSocketMessage);
    setConnectionTimer();
}


/**
 * Handle Socket Connect
 */
function handleSocketConnect(){
    print("Connected to socket server");
    clearTimeout(connectionTimer);
    connectingModal.hide();
    connected = true;
    checkQueue();
    send("connect");
};


/**
 * Handle Socket Disconnect
 * Occurs whenever the connnection between the client and server is
 * severed (this will only occur if the connection is lost or there is
 * an internal server error). When this event is fired, Comet will
 * attempt to reconnect to the socket server.
 */
function handleSocketDisconnect(){
    connected = false;
    setConnectionTimer();
    print("Unexpectedly disconnected from socket server");
};


/**
 * Set Connection Timer
 */
function setConnectionTimer(){
    clearTimeout(connectionTimer);
    connectionTimer = setTimeout(function(){
        print("Connection taking too long, showing modal.");
        connectingModal.display(true);
    }, CONNECTION_ERROR_DELAY);
}


/**
 * Handle Socket Message
 * Handles incoming messages from the socket server, subdividing
 * each message type into it's own function.
 * @param {Object} data Data from socket server
 */
function handleSocketMessage(data){
    if(!("action" in data)){
        print("A malformed message was received from the socket server. (Socket Message).", true);
        return;
    }

    switch(data.action){
        case "search":
            handleSocketQueryResponse(data);
            break;
        case "push_message":
            handleSocketPushMessage(data);
            break;
        case "message":
            handleSocketChannelMessage(data);
            break;
        case "message_sent":
            break;
        default:
            print("A message was received with an unrecognized action: '" + data.action + "'");
    }
};


/**
 * Handle Push Message
 * Handles and displays an incoming push message in the same way that a
 * message from Django's messaging framework would be handled.
 * @param {Object} data Data from socket server
 */
function handleSocketPushMessage(data){
    if(!("type" in data) || !("message" in data)){
        print("A malformed message was received from the Socket IO server. (Push Message)", true);
        return;
    }

    print("Received message of type '" + data.type + "'. Displaying.");
    var instance = new PushMessage(data.type, data.message);

    // Handle any buttons that could be appended to the message
    var buttons = $("[class^='button-request-'][data-user-id][data-new]");
    buttons.on("click", function(event){
        var accept = $(this).is("[class*='accept']");
        answerFriendRequest(accept, $(this).attr("data-user-id"));
        instance.remove();
    });
    buttons.removeAttr("data-new");

    if(data.request_confirmation && "message_id" in data){
        // Server has asked the client to confirm that it received this message
        send("message_confirm", data.message_id);
        print("Message confirmation sent for message with id '" + data.message_id + "'");
    }
};


/**
 * Send Friend Request
 * Sends a friend request to a given user (requires that users UUID).
 * @param {string} user_id UUID of the target user
 */
function sendFriendRequest(user_id){
    send("friend_req", user_id);
    print("Friend request sent to user with id '" + user_id + "'");
};


/**
 * Answer Friend Request
 * Responds to a friend request.
 * @param {boolean} accept Should the request be accepted
 * @param {string} user_id UUID of the target user
 */
function answerFriendRequest(accept, user_id){
    send("answer_friend_req", {
        accept: accept,
        user_id: user_id,
    });
    print((accept ? "Accepted" : "Denied") + " friend request from user with id '" + user_id + "'.");
}


/**
 * Handle Query Response
 * Handles incoming query responses from the Socket IO server.
 * @param {Object} data Data from Socket IO server
 */
function handleSocketQueryResponse(data){
    if(!("users" in data) || !("friends" in data)){
        print("A malformed message was received from the socket server. (Query Response)", true);
        return;
    }

    print("Query response received.");
    var users = JSON.parse(data.users);
    var friends = data.friends;
    updateSearch(users, friends);
};


/**
 * Announce User Join
 * Adds a message each time a user joins the current channel.
 * @param {Object} data Data from Socket IO server
 */
function announceUserJoin(data){
    $(".chat-body").append("<p class=\"user-join\">" + data.username + " has joined the group.</p>")
    print(data.username + " has joined the group.");
}


/**
 * Handle Chat Message
 * Displays a chat message in the chat body.
 * @param {Object} data Data from Socket IO server
 */
var handleSocketChannelMessage = function(data){
    if(!("sender_id" in data) || !("time_sent" in data) || !("message" in data) || !("channel_url" in data)){
        print("A malformed message was received from the Socket IO server. (Chat Message)", true);
        return;
    }

    if(data.channel_url == window.channel_url){
        if(data.sender_id == window.user_id){
            print("Message successfully sent.");
            return;
        }
        appendMessage(data.message, data.sender, data.sender_id, data.time_sent);
    }else{
        new PushMessage(MessageType.INFO, "You have received a new message from '" + data.sender + "'. Check it out here: <div class='push-message-well'><a href=''>" + "put a bloody url here mate." + "</a></div>");
    }
}
/* END SOCKETS */
