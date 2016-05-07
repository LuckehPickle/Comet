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

/**
 * TODO Migrate friend requests
 * TODO replace JQuery animations with Mo.js
 */


/**
 * Message Types
 * Enum for push message types. This essentially allows the creation of
 * push messages that are compatible with Django's messaging framework.
 * https://git.io/vwgcG
 * @enum {number}
 */
var MessageTypes = {
    DEBUG: 10,
    INFO: 20,
    SUCCESS: 25,
    WARNING: 30,
    ERROR: 40,
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
 * Create Push Message
 * Creates, displays and initialises a new push message.
 * @param {number} type Type of push message. Refer to MessageType enum.
 * @param {string} message Message to display on the push message.
 */
function createPushMessage(type, message){
    $(".push-messages").append(
        "<div class=\"push-message-container-" + type + "\" data-new>" +
            "<svg class=\"push-message-close-" + type + "\" viewBox=\"0 0 20 20\">" +
                "<path d=\"M0 3 L3 0 L10 7 L17 0 L20 3 L13 10 L20 17 L17 20 L10 13 L3 20 L0 17 L7 10 z\">" +
            "</svg>" +
            "<p class=\"push-message-content-" + type + "\">" + message + "</p>" +
        "</div>"
    );

    var $container = $("[class^=\"push-message-container\"][data-new]");
    $container.fadeIn(300);
    $container.removeAttr("data-new");

    $("[class^=\"push-message-close\"]").on("click", function(){
        closePushMessage($(this));
    });
}


/**
 * Close Push Message
 * Closes a puch message and sends a confirmation response to the server
 * if necessary.
 * @param {Element} source Element which fired the event.
 */
function closePushMessage(source){
    // Move up the DOM until you reach the container
    while(!source.is("[class*=\"push-message-container\"]")){
        source = source.parent();
    }

    source.slideUp(300, function(){
        source.remove();
        print(false, "Push message closed.");
        /**
         * TODO send confirmation here, so that messages will last across
         * multiple page loads (until the user performs an action which
         * causes the message to close).
         * This will require Sockets to be handled in this script first.
         */
    });
}


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


/**
 * Show Modal
 * Makes a modal visible to the user, acts as an interface to the modal
 * management chunk.
 * @param {Object} modal Modal to be shown to the user
 * @param {number} importance Whether the modal should override other modals
 */
function showModal(modal, importance){
    print(false, "Showing modal");
    modal.attr("data-importance", importance.toString()); // Set the modals importance
    var modalInForeground = getModalInForeground();
    if(modalInForeground == null || importance > parseInt(modalInForeground.attr("data-importance"), 10)){
        setModalInForeground(modal);
        return;
    }
    setModalInBackground(modal, true);
}


/**
 * Hide Modal
 * Hides a modal.
 * @param {Object} modal Modal to be shown to the user
 */
function hideModal(modal){
    if(!modal.is("[active]")){
        return;
    }

    print(false, "Hiding modal");
    modal.removeAttr("active");

    if(modal.is("[foreground]")){
        modal.removeAttr("foreground");
        $(".modal-wrapper").fadeOut(300, function(){
            $(".modal-wrapper").removeAttr("active");
        });
    }

    if(modal.is("[background]")){
        modal.removeAttr("background");
    }
}


/**
 * Get Modal In Foreground
 * Gets whichever modal is currently in the foreground (if any).
 * @return {Object} The modal in the foreground (if any).
 */
function getModalInForeground(){
    var activeModals = $(".modal-wrapper").children("[foreground]");
    if(activeModals.length > 0){
        return activeModals[0];
    }
    return null;
}


/**
 * Set Modal In Foreground
 * Queues any modal that is currently in the foreground, and pushes this
 * modal to the foreground.
 * @param {Object} modal Modal to be moved to the foreground
 */
function setModalInForeground(modal){
    if(modal.is("[foreground]"))
        return; // Modal is already in the foreground

    if(!$(".modal-wrapper").is["active"]){
        $(".modal-wrapper").attr("active", "");
        $(".modal-wrapper").fadeIn(300);
    }

    var modalInForeground = getModalInForeground();
    if(modalInForeground != null){
        modalInForeground.removeAttr("foreground");
        setModalInBackground(modalInForeground, false);
    }

    modal.attr("foreground", "");
    modal.attr("active", "");
    modal.removeAttr("background");
}


/**
 * Set Modal In Background
 * Queues any modal that is currently in the foreground, and pushes this
 * modal to the foreground.
 * @param {Object} modal Modal to be set to the background
 * @param {boolean} check Whether to check if the wrapper needs to be hidden
 */
function setModalInBackground(modal, check){
    if(modal.is("[background]"))
        return; // Modal is already in the background

    var modalInForeground = getModalInForeground();
    if(check && modalInForeground == null){
        $(".modal-wrapper").fadeOut(300, function(){
            $(".modal-wrapper").removeAttr("active");
        });
    }

    modal.attr("background", "");
    modal.attr("active", "");
    modal.removeAttr("foreground");
}


/**
 * Sockets from here down
 */
var socket; // A reference to the Socket IO socket.
var connected = false;
var queue = [];


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
            socket.emit(item["eventType"], item["value"]);
        }
        print(true, "Emptied socket queue.");
    }
}


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
 * JQuery Document Ready function. The following code is run whenever the page
 * has finished loading and is ready to work with.
 */
$(function(){

    /** @const */ var CONNECTION_ERROR_DELAY = 300;
    var connectionTimer; // Tracks the time it's taken to connect


    /**
     * Start Socket
     * Attempts to open a connection with the socket server, but only if the
     * user is logged in.
     */
    var startSocket = function(){
        if(window.user_id != null){
            openConnection();
        }
    };


    /**
     * Open Connection
     * Attempts to open a connection with the socket server
     */
    var openConnection = function(){
        print(false, "Connecting to socket server...");
        socket = io.connect("/messenger");
        socket.on("connect", handleSocketConnect);
        socket.on("disconnect", handleSocketDisconnect);
        socket.on("message", handleSocketMessage);
        setConnectionTimer();
    }


    /**
     * Handle Socket Connect
     */
    var handleSocketConnect = function(){
        connected = true;
        clearTimeout(connectionTimer);
        hideModal($(".modal-connecting"));
        print(false, "Connected to socket server");
        checkQueue();
    };


    /**
     * Handle Socket Disconnect
     * Occurs whenever the connnection between the client and server is
     * severed (this will only occur if the connection is lost or there is
     * an internal server error). When this event is fired, Comet will
     * attempt to reconnect to the socket server.
     */
    var handleSocketDisconnect = function(){
        connected = false;
        setConnectionTimer();
        print(true, "Unexpectedly disconnected from socket server");
    };


    /**
     * Set Connection Timer
     */
    var setConnectionTimer = function(){
        clearTimeout(connectionTimer);
        connectionTimer = setTimeout(function(){
            print(false, "Connection taking too long, showing modal");
            showModal($(".modal-connecting"), ModalImportance.HIGH);
        }, CONNECTION_ERROR_DELAY);
    }


    /**
     * Handle Socket Message
     * Handles incoming messages from the socket server, subdividing
     * each message type into it's own function.
     * @param {Object} data Data from socket server
     */
    var handleSocketMessage = function(data){
        if(!("action" in data)){
            print(true, "A malformed message was received from the socket server. (Socket Message).");
            return;
        }

        switch(data.action){
            case "search":
                handleQueryResponse(data);
                break;
            case "push_message":
                handlePushMessage(data);
                break;
        }
    };


    /**
     * Handle Push Message
     * Handles and displays an incoming push message in the same way that a
     * message from Django's messaging framework would be handled.
     * @param {Object} data Data from Socket IO server
     */
    var handlePushMessage = function(data){
        if(!("type" in data) || !("message" in data)){
            print(true, "A malformed message was received from the Socket IO server. (Push Message)");
            return;
        }

        print(false, "Received message of type '" + data.type + "'. Displaying.");
        createPushMessage(data.type, data.message);

        // Handle any buttons that could be appended to the message
        $("[class^=\"button-request-\"][data-user-id][data-new]").on("click", function(event){
            var accept = $(this).is("[class*=\"accept\"]");
            answerFriendRequest(accept, $(this).attr("data-user-id"));
            closePushMessage($(this));
        });
        $("[class^=\"button-request-\"][data-user-id][data-new]").removeAttr("data-new");

        if(data.request_confirmation && "message_id" in data){
            // Server has asked the client to confirm that it received this message
            send("message_confirm", data.message_id);
            print(false, "Message confirmation sent for message with id '" + data.message_id + "'");
        }
    };


    // Fade in any idle push messages
    $("div[class^=\"push-message-container\"]").fadeIn(300);

    /**
     * Add Event Listeners
     */
    var addEventListeners = function(){
        // Listens for click events on push message close buttons
        $("[class^=\"push-message-close\"], [class^=\"button-request-\"]").on("click", function(){
            closePushMessage($(this));
        });
    };

    addEventListeners();
    startSocket();

});
