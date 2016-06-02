/**
 * @license Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Looking for source code? Check it out here: https://github.com/LuckehPickle/Comet
 */

/**
 * [Shared] BASE.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Powered by Django (https://www.djangoproject.com/) - Not endorsed by Django
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
 * Formats and outputs a string to the console.
 * @param {boolean} error Show as an error
 * @param {string} out Message to output
 */
function print(error, out){
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
 * Sends data back to the socket server.
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
        print(false, "Emptied socket queue.");
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
 */
class PushMessage{

    /**
     * @constructor
     * @param {number} type Type of push message. Refer to MessageType enum
     * @param {string} message Message to display inside the push message
     */
    constructor(type, message){
        this.type = type;
        this.message = message;
        this.display();
    }

    /**
     * Displays and initialises the push message
     */
    display(){
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

        $("[class^='push-message-close']").on("click", function(){
            closePushMessage($(this));
        });

        print(false, "Push message of type '" + this.type + "' created.");
    }
}


/**
 * Close Push Message
 * Closes a push message and sends a confirmation response to the server
 * if necessary.
 * @param {Element} source Element which fired the event.
 */
function closePushMessage(source){
    while(!source.is("[class*='push-message-container']")){
        source = source.parent(); // Scale the DOM tree
    }

    source.slideUp(300, function(){
        source.remove();
        print(false, "Push message closed.");
    });
}
/* END PUSH MESSAGES */


/* BEGIN MODALS */
/**
 * Modal Importance
 * Enum for modal importance levels.
 * @enum {number}
 */
var ModalImportance = {
    LOW: 0, // Modals that are not from the user
    MEDIUM: 50, // Typically modals that the user has requested
    HIGH: 100, // Any modal with a pressing need to be seen by the user.
}

// Keeps track of all registered modals
var modals = {};


/**
 * Modal
 * Contains a modals foreground and background components as well as some
 * other metadata (including importance).
 */
class Modal{

    /**
     * @constructor
     * @param {String} title Modal identifier/title
     * @param {Object} foreground Foreground JQuery element of the modal
     * @param {Object} background Background JQuery element of the modal
     * @param {number} importance Modal importance level (refer to Modal Importance enum)
     */
    constructor(title, foreground, background, importance){
        this.title = title;
        this.foreground = $(foreground);
        this.background = $(background);
        this.importance = importance;
    }

    /**
     * Is Foreground
     * Checks if the modal is currently rendered in the foreground
     * @return {boolean} Is the modal in the foreground
     */
    isForeground(){
        return this.foreground.is("[active]");
    }
}


/**
 * Show Modal
 * Attempts to show the modal that is given. If the importance level is
 * lower than the currently active modal (if any), then the modal will be
 * automatically shown in the modal queue (background).
 * @param {Modal} modal Modal to be shown to the user
 * @param {boolean} foreground Whether the modal should be shown in the foreground
 */
function showModal(modal, foreground){
    if(foreground){
        // Check if there is room in the foreground
        var activeModal = getModalInForeground();
        if(activeModal != null){
            if(modal.importance <= activeModal.importance){
                setModalInBackground(modal, false);
                return;
            }
        }
        setModalInForeground(modal);
        return;
    }
    setModalInBackground(modal, true);
}


/**
 * Hide Modal
 * Hides a modal.
 * @param {Modal} modal Modal to be hidden
 */
function hideModal(modal){
    if(modal.foreground.is("[active]")){
        modal.foreground.fadeOut(300, function(){
            modal.foreground.removeAttr("active");
            // TODO Show next queued modal
        });

        $("body").removeClass("modal-open");
        $("._modal-wrapper").fadeOut(300, function(){
            $(this).removeAttr("active");
        });
    }

    if(modal.background.is("[active]")){
        modal.background.slideDown(300, function(){
            modal.background.hide();
            modal.background.removeAttr("active");
        });
    }
    print(false, "Hiding modal with title '" + modal.title + "'");
}


/**
 * Get Modal In Foreground
 * Gets any modals which are currently in the foreground and active.
 * @return {Modal} The modal in the foreground (if any).
 */
function getModalInForeground(){
    for(var key in modals){
        var modal = modals[key];
        if(modal.isForeground()){
            return modal;
        }
    }
}


/**
 * Set Modal In Foreground
 * Queues any modal that is currently in the foreground, and pushes this
 * modal to the foreground.
 * @param {Modal} modal Modal to be moved to the foreground
 */
function setModalInForeground(modal){
    if(modal.foreground.is("[active]"))
        return;

    var activeModal = getModalInForeground();
    if(activeModal != null){
        setModalInBackground(activeModal, false);
    }

    if(modal.background.is("[active]")){
        modal.background.slideDown(300, function(){
            modal.background.hide();
            modal.background.removeAttr("active");
        });
    }

    if(!$("._modal-wrapper").is("[active]")){
        $("._modal-wrapper").fadeIn(300);
        $("._modal-wrapper").attr("active", "");
        $("body").addClass("modal-open");
    }

    modal.foreground.fadeIn(300);
    modal.foreground.attr("active", "");
    print(false, "Showing modal titled '" + modal.title + "' in foreground.")
}


/**
 * Set Modal In Background
 * Queues any modal that is currently in the foreground, and pushes this
 * modal to the foreground.
 * @param {Modal} modal Modal to be set to the background
 * @param {boolean} check Whether to check if the wrapper needs to be hidden
 */
function setModalInBackground(modal, check){
    if(modal.background.is("[active]"))
        return;

    if(modal.foreground.is("[active]")){
        modal.foreground.fadeOut(300, function(){
            $(this).removeAttr("active");
        });
    }

    if(check && $("._modal-wrapper").is("[active]")){
        $("body").removeClass("modal-open");
        $("._modal-wrapper").fadeOut(300, function(){
            $(this).removeAttr("active");
        });
    }

    modal.background.fadeIn(300);
    modal.background.attr("active", "");
    print(false, "Showing modal titled '" + modal.title + "' in background.");
}


/**
 * Get Modal Object From Element
 * Attempts to find the registered modal assosciated with a particular
 * JQuery element.
 * @param {Object} element Assosciated element
 * @return {Modal} The registered modal (if found)
 */
function getModalObjectFromElement(element){
    if(!element.is("._modal[class*='modal-']"))
        return; // Elem is not a modal

    var className = element.attr("class"); // String version of the elems class
    var index = className.indexOfEnd("modal-");
    var title = className.substring(index, className.indexOf(" ", index));
    if(title in modals){
        return modals[title];
    }
}
/* END MODALS */


/* BEGIN TABS */
/**
 * Open Tab
 * Closes all tabs, then opens the tab-head that is passed.
 * @param {Element} tab The 'tab-head' or 'tab-body' to be opened.
 */
function openTab(tab){
    $(".tab-head[active], .tab-body[active]").removeAttr("active");
    $("[data-tab=\"" + tab.attr("data-tab") + "\"]").attr("active", "");
    print(false, "Opened tab with id '" + tab.attr("data-tab") + "'")
}
/* END TABS */


/* BEGIN SOCKETS */
/** @const */ var CONNECTION_ERROR_DELAY = 300;
var connectionTimer; // Tracks the time it's taken to connect
var socket; // A reference to the Socket IO socket.
var connected = false;
var queue = [];


/**
 * Start Socket
 * Attempts to open a connection with the socket server, but only if the
 * user is logged in.
 */
function _startSocket(){
    if(window.user_id != null){
        _openConnection();
    }
};


/**
 * Open Connection
 * Attempts to open a connection with the socket server
 */
function _openConnection(){
    print(false, "Connecting to socket server...");
    socket = io.connect("/messenger");
    socket.on("connect", _handleSocketConnect);
    socket.on("disconnect", _handleSocketDisconnect);
    socket.on("message", _handleSocketMessage);
    _setConnectionTimer();
}


/**
 * Handle Socket Connect
 */
function _handleSocketConnect(){
    connected = true;
    clearTimeout(connectionTimer);
    hideModal(getModalObjectFromElement($(".modal-connecting")));
    print(false, "Connected to socket server");
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
function _handleSocketDisconnect(){
    connected = false;
    _setConnectionTimer();
    print(true, "Unexpectedly disconnected from socket server");
};


/**
 * Set Connection Timer
 */
function _setConnectionTimer(){
    clearTimeout(connectionTimer);
    connectionTimer = setTimeout(function(){
        print(false, "Connection taking too long, showing modal");
        showModal(getModalObjectFromElement($(".modal-connecting")), true);
    }, CONNECTION_ERROR_DELAY);
}


/**
 * Handle Socket Message
 * Handles incoming messages from the socket server, subdividing
 * each message type into it's own function.
 * @param {Object} data Data from socket server
 */
function _handleSocketMessage(data){
    if(!("action" in data)){
        print(true, "A malformed message was received from the socket server. (Socket Message).");
        return;
    }

    switch(data.action){
        case "search":
            _handleQueryResponse(data);
            break;
        case "push_message":
            _handlePushMessage(data);
            break;
        case "message":
            _handleChatMessage(data);
            break;
        default:
            print(false, "A message was received with an unrecognized action: '" + data.action + "'");
    }
};


/**
 * Handle Push Message
 * Handles and displays an incoming push message in the same way that a
 * message from Django's messaging framework would be handled.
 * @param {Object} data Data from socket server
 */
function _handlePushMessage(data){
    if(!("type" in data) || !("message" in data)){
        print(true, "A malformed message was received from the Socket IO server. (Push Message)");
        return;
    }

    print(false, "Received message of type '" + data.type + "'. Displaying.");
    new PushMessage(data.type, data.message);

    // Handle any buttons that could be appended to the message
    var buttons = $("[class^='button-request-'][data-user-id][data-new]");
    buttons.on("click", function(event){
        var accept = $(this).is("[class*='accept']");
        answerFriendRequest(accept, $(this).attr("data-user-id"));
        closePushMessage($(this));
    });
    buttons.removeAttr("data-new");

    if(data.request_confirmation && "message_id" in data){
        // Server has asked the client to confirm that it received this message
        send("message_confirm", data.message_id);
        print(false, "Message confirmation sent for message with id '" + data.message_id + "'");
    }
};


/**
 * Send Friend Request
 * Sends a friend request to a given user (requires that users UUID).
 * @param {string} user_id UUID of the target user
 */
function sendFriendRequest(user_id){
    send("friend_req", user_id);
    print(false, "Friend request sent to user with id '" + user_id + "'");
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
    print(false, (accept ? "Accepted" : "Denied") + " friend request from user with id '" + user_id + "'.");
}


/**
 * Request Query Response
 * Request a response to the search query via Socket IO.
 * @param {string} query Query to be requested.
 */
var requestQueryResponse = function(query){
    if(query == "" || query == null || query.length < 2){
        print(false, "Query cancelled (Possibly too short).");
        return;
    }

    send("search", query);
    print(false, "Sent a query for users named '" + query + "'");
};


/**
 * Handle Query Response
 * Handles incoming query responses from the Socket IO server.
 * @param {Object} data Data from Socket IO server
 */
function _handleQueryResponse(data){
    if(!("users" in data) || !("friends" in data)){
        print(true, "A malformed message was received from the socket server. (Query Response)");
        return;
    }

    print(false, "Query response received.");
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
    print(false, data.username + " has joined the group.");
}


/**
 * Send Socket Message
 * Sends a chat message to the Socket IO server.
 * @param {string} message Chat message to be sent to Socket IO server
 */
var sendSocketMessage = function(message){
    if(message == null || message == "")
        return;

    if(window.channel_id == null){
        print(true, "Attempted to send a message but not currently connected to a channel.");
        return;
    }

    send("message", {channel_id: window.channel_id, message: message});
    appendMessage(message, window.username, window.user_id, Date.now());
    print(false, "Chat message successfully sent to Socket IO server.");
};


/**
 * Append Message
 * Adds a new message to the chat body.
 */
function appendMessage(message, sender, sender_id, time_sent){
    $(".no-messages").remove();
    var mostRecent = $(".chat-body").children().last();
    var classTag = (sender_id == window.user_id) ? "" : "-other";
    var time = new Date(time_sent).toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    });

    if(mostRecent.attr("data-user-id") == sender_id){
        // A new message from the same user. We can safely tag.
        mostRecent.children(".chat-message-sender" + classTag).remove();
        mostRecent.append("<p class=\"chat-message-sender" + classTag + "\">" + sender + " (" + time + ")</p>");
        mostRecent.children("section").append("<div class=\"chat-message-content" + classTag + "-tag\" data-new></div>");
    }else{
        // From a new user, append.
        $(".chat-body").append(
            "<div class=\"chat-message-container" + classTag + "\" data-user-id=\"" + sender_id + "\">" +
                "<div class=\"chat-message-image" + classTag + "\"></div>" +
                "<span class=\"triangle-top-" + (classTag ? "right" : "left") + "\"></span>" +
                "<section>" +
                    "<div class=\"chat-message-content" + classTag + "\" data-new></div>" +
                "</section>" +
                "<p class=\"chat-message-sender" + classTag + "\">" + sender + " (" + time + ")</p>" +
            "</div>"
        );
    }

    // Add the message afterwards via .text() to escape HTML
    messageContent = $("[class^=\"chat-message-content\"][data-new]");
    messageContent.text(message);
    messageContent.removeAttr("data-new");

    // Make sure that the body is scrolled to the bottom
    scrollToBottom($(".chat-body"));
}


/**
 * Handle Chat Message
 * Displays a chat message in the chat body.
 * @param {Object} data Data from Socket IO server
 */
var _handleChatMessage = function(data){
    if(!("sender_id" in data) || !("time_sent" in data) || !("message" in data) || !("channel_id" in data)){
        print(true, "A malformed message was received from the Socket IO server. (Chat Message)");
        return;
    }

    if(data.channel_id == window.channel_id){
        appendMessage(data.message, data.sender, data.sender_id, data.time_sent);
    }else{
        new PushMessage(MessageType.INFO, "You have received a new message from '" + data.sender + "'. Check it out here: <div class='push-message-well'><a href=''>" + "put a bloody url here mate." + "</a></div>");
    }

}
/* END SOCKETS */


/* BEGIN SEARCH */
/** @const */ var DONE_TYPING_INTERVAL = 100; // How long should typing last (milliseconds)
var typing_timer; // Tracks the typing timeout

/**
 * Update Search
 * Removes stale search data and adds the latest data from the server.
 * @param {JSON} users A list of users that mach the query
 * @param {Object} friends A dict of friend statuses
 */
function updateSearch(users, friends){
    removeStaleSearches();

    if(users.length == 0){ // No data returned (i.e. Empty result)
        $(".search-dropdown-users").append("<p class=\"search-dropdown-no-results\">No results found.</p>");
        return;
    }

    // Iterate over each user
    jQuery.each(users, function(){
        // Defaults
        var innerHTML = "<i class=\"material-icons\">add</i> Add";
        var queryClass = "add"; // Class that the response should be given

        if(this.pk in friends){
            // There is a relationship between these two users
            switch(friends[this.pk]){
                case "friend":
                    // Users are friends
                    innerHTML = "Friends";
                    queryClass = "friend";
                    break;
                case "request_sent":
                    // User has sent a request to response user
                    innerHTML = "Request Sent";
                    queryClass = "sent";
                    break;
                case "request_received":
                    // User has received a request from the response user
                    innerHTML = "Accept Request";
                    queryClass = "request";
                    break;
            }
        }

        $(".search-dropdown-users").append(
        "<div class=\"dropdown-results-container\">" +
            "<div class=\"dropdown-result-image\"></div>" +
            "<section>" +
                "<p class=\"dropdown-result-username\">" + this.fields.username + " (" + this.pk.substring(0, 8).toUpperCase() + ")</p>" +
                "<p class=\"dropdown-result-tags\">Regular User</p>" +
            "</section>" +
            "<div class=\"dropdown-result-button-" + queryClass + "\" data-user-id=" + this.pk + " data-user-url=" + this.fields.user_url + ">" + innerHTML + "<link class=\"rippleJS\"/></div>" +
            //"<link class=\"rippleJS\"/>" +
        "</div>");
    });

    // Add event listeners to the new data
    var queryItems = $(".dropdown-result-button-add, .dropdown-result-button-request");
    queryItems.on("click", function(){
        sendFriendRequest($(this).attr("data-user-id"));
        // Update the old data by requesting a new query
        requestQueryResponse($(".search input").val());
    });
};


/**
 * Remove Stale Searches
 * Clears the search list of any stale data.
 */
var removeStaleSearches = function(){
    var $children = $(".search-dropdown-users").children(":not(.search-dropdown-title)");
    $children.each(function(){
        $(this).remove();
    });
};


/**
 * Search Typing Complete
 * Function which runs whenever the typing timer runs out. It essentially
 * means the user has finished typing.
 */
function searchTypingComplete(){
    requestQueryResponse($(".search input").val());
};
/* END SEARCH */


/**
 * Add Event Listeners
 * To be run at each page load, initialises any event listeners.
 */
function addEventListeners(){
    /* BEGIN PUSH MESSAGES */
    var pushMessages = $("[class^='push-message-close'], [class^='button-request-']");
    pushMessages.off(".base");
    pushMessages.on("click.base", function(){
        closePushMessage($(this));
    });

    var pushMessageButton = $("[class^=\"button-request-\"][data-user-id]");
    pushMessageButton.off(".base");
    pushMessageButton.on("click.base", function(event){
        var accept = $(this).is("[class*='-accept']");
        answerFriendRequest(accept, $(this).attr("data-user-id"));
    });
    /* END PUSH MESSAGES */

    /* BEGIN MODALS */
    var bgify = $(".bgify");
    bgify.off(".base");
    bgify.on("click.base", function(){
        var source = $(this).parent();
        while(!source.hasClass("_modal")) // Scale the DOM tree
            source = source.parent();
        setModalInBackground(getModalObjectFromElement(source), true);
    });

    var modalBackground = $("._modal[background]");
    modalBackground.off(".base");
    modalBackground.on("click.base", function(){
        var modal = $(this);
        while(!modal.hasClass("_modal")) // Scale the DOM tree
            modal = modal.parent();
        setModalInForeground(getModalObjectFromElement(modal));
    });
    /* END MODALS */

    /* BEGIN CREATE MODAL */
    var createTrigger = $(".create-group-trigger");
    createTrigger.off(".base");
    createTrigger.on("click.base", function(){
        showModal(getModalObjectFromElement($(".modal-create")), true);
    });

    var createCancel = $(".modal-create-cancel");
    createCancel.off(".base");
    createCancel.on("click.base", function(){
        hideModal(getModalObjectFromElement($(".modal-create")));
    });
    /* END CREATE MODAL */

    /* BEGIN PJAX */
    $(document).off(".base");
    $(document).pjax("a[data-pjax]", ".pjax-body");
    $(document).pjax("a[data-pjax-m]", ".chat-right");
    $(document).on("pjax:start.base", function(){ NProgress.start();});
    $(document).on("pjax:end.base",   function(){ NProgress.done();});
    NProgress.configure({ showSpinner: false });
    /* END PJAX */

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

    /* BEGIN CHAT */
    var chatForm = $(".chat-form");
    chatForm.off("submit");
    chatForm.submit(function(){
        sendSocketMessage($(".chat-form-input").text());
        $(".chat-form-input").text("");
        return false; // Prevents the form from submitting
    });

    var chatFormInput = $(".chat-form-input");
    chatFormInput.off(".base");
    chatFormInput.on("keydown.base", function(event){
        if(event.which == 13){ // Enter key press
            chatForm.submit();
            return false;
        }
    });

    var chatSend = $(".chat-send");
    chatSend.off(".base");
    chatSend.on("click.base", function(){
        chatForm.submit();
    });
    /* END CHAT */

    /* BEGIN TABS */
    var tabHeads = $(".tab-head");
    tabHeads.off(".base");
    tabHeads.on("click.base", function(event){
        openTab($(this));
    });

    var tabContainers = $(".friend-container, .group-container");
    tabContainers.off(".base");
    tabContainers.on("click.base", function(){
        tabContainers.removeAttr("active");
        if(!$(this).is("[active]")){
            $(this).attr("active", "");
        }
    });
    /* END TABS */

    /* BEGIN SEARCH */
    var searchInput = $(".search input");
    searchInput.off(".base");
    searchInput.on("keyup.base", function(){
        clearTimeout(typing_timer);
        typing_timer = setTimeout(searchTypingComplete, DONE_TYPING_INTERVAL);
    });
    searchInput.on("keydown.base", function(){
        clearTimeout(typing_timer);
    });

    var searchIcon = $(".search:not([active]) i");
    searchIcon.off(".base");
    searchIcon.on("click.base", function(){
        searchInput.focus();
    });

    // No need to remove events here, it was done above
    $(".search:not([active]) input").on("focus.base", function(){
        $(".search-dropdown").hide();
        $(this).parent().attr("active", "");
        $(this).select();
        setTimeout(function(){
            $(".search-dropdown").slideDown(200);
        }, 300);
    });
    /* END SEARCH */

    $("html").off(".base");
    $("html").on("click.base", handleDocumentEvent);
};


/**
 * Handle Document Event
 * Event handler for whenever the document is clicked. This is externalised
 * so that other scripts can override it with their event handlers. Just be
 * sure to call this one as well. Example:
 * $("html").on("click", function(event){
 *     handleDocumentEvent(event);
 *     ...
 * });
 * @param {Object} event Event data
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

    /* BEGIN SEARCH */
    if(!$(event.target).closest(".search").length && !$(event.target).is(".search")){
        if($(".search").is("[active]")){
            $(".search-dropdown").slideUp(200, function(){
                $(".search").removeAttr("active");
            });
        }
    }
    /* END SEARCH */
}


/**
 * Register Modals
 * Register and modals here
 */
function registerModals(){
    modals["connecting"] = new Modal(
        "connecting",
        $(".modal-connecting[foreground]"),
        $(".modal-connecting[background]"),
        ModalImportance.HIGH
    );

    modals["create"] = new Modal(
        "create",
        $(".modal-create[foreground]"),
        $(".modal-create[background]"),
        ModalImportance.MEDIUM
    );
};


/**
 * Init Page
 * Handles page initialisation. Event handlers etc.
 */
function initPage(){
    // Fade in any idle push messages
    $("div[class^='push-message-container']").fadeIn(300);
    addEventListeners();
    registerModals();
    scrollToBottom($(".chat-body"));
}


/**
 * JQuery Document Ready function. The following code is run whenever the page
 * has finished loading and is ready to work with.
 */
$(document).on("pjax:success", function(){
    initPage();
});

$(document).on("ready", function(){
    _startSocket();
    initPage();
});
