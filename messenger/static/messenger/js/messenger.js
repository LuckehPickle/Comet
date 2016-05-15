/**
 * @license Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Looking for source code? Check it out here: https://github.com/LuckehPickle/Comet
 */

/**
 * [Messenger] MESSENGER.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
 * Open Tab
 * Closes all tabs, then opens the tab-head that is passed.
 * @param {Element} tab The 'tab-head' or 'tab-body' to be opened.
 */
function openTab(tab){
    $(".tab-head[active], .tab-body[active]").removeAttr("active");
    $("[data-tab=\"" + tab.attr("data-tab") + "\"]").attr("active", "");
    print(false, "Opened tab with id '" + tab.attr("data-tab") + "'")
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
        $(".dropdown-users").append("<p class=\"dropdown-no-results\">No results found.</p>");
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

        $(".dropdown-users").append(
        "<div class=\"dropdown-results-container\">" +
            "<div class=\"dropdown-result-image\"></div>" +
            "<section>" +
                "<p class=\"dropdown-result-username\">" + this.fields.username + " (" + this.pk.substring(0, 8).toUpperCase() + ")</p>" +
                "<p class=\"dropdown-result-tags\">Beta Tester</p>" +
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
        requestQueryResponse($(".tools-input-wrapper input").val());
    });
};


/**
 * Remove Stale Searches
 * Clears the search list of any stale data.
 */
var removeStaleSearches = function(){
    var $children = $(".dropdown-users").children(":not(.dropdown-title)");
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
    requestQueryResponse($(".tools-input-wrapper > input").val());
};


/**
 * Add Event Listeners
 * Registers event listeners for any items which need it on startup.
 */
function addEventListenersMessenger(){
    /**
     * Add event listeners to any friend request buttons that are added through
     * Django's messaging framework, or the template.
     */
    $("[class^=\"button-request-\"][data-user-id]").on("click", function(event){
        var accept = $(this).is("[class*='-accept']");
        answerFriendRequest(accept, $(this).attr("data-user-id"));
    });


    // Listens for 'keyup' events to reset the typing_timer
    $(".tools-input-wrapper > input").on("keyup", function(){
        clearTimeout(typing_timer);
        typing_timer = setTimeout(searchTypingComplete, DONE_TYPING_INTERVAL);
    });


    // Clears the timer but doesn't restart it, as the key is still pressed.
    $(".tools-input-wrapper > input").on("keydown", function(){
        clearTimeout(typing_timer);
    });

    // Handles the submit function on the chat form.
    $(".chat-form").submit(function(){
        input = $(".chat-form-input");
        sendSocketMessage(input.text());
        input.text("");
        return false; // Lets the VM now we've handled the event
    });

    // Handles tab swapping
    $(".tab-head").on("click", function(event){
        openTab($(this));
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
    });

    // Handles the submit function on the chat form.
    $(".chat-form").submit(function(){
        input = $(".chat-form-input");
        sendSocketMessage(input.text());
        input.text("");
        return false; // Lets the VM now we've handled the event
    });

    // Handles the 'send' button click event.
    $(".chat-send").on("click", function(){
        $(".chat-form").submit();
    });

    // Search Bar
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

    $(".tool-container").on("click", function(event){
        if(!$(event.target).closest(".tool-container-dropdown").length && !$(event.target).is(".tool-container-dropdown")){
            $(this).children(".tool-container-dropdown").slideDown(200);
        }
    });

    $(".tool-container-dropdown").on("click", function(){
        $(this).hide();
    });

    $(".modal-wrapper, ._modal").hide();

    $(".create-group-trigger").on("click", function(){
        console.log();
        showModal(getModalObjectFromElement($(".modal-create")), true);
    });

    $(".modal-create-cancel").on("click", function(){
        hideModal(getModalObjectFromElement($(".modal-create")));
    });

    // Clicking anywhere on the document.
    $("html").on("click", function(event){
        if(!$(event.target).closest(".tools-input-wrapper").length && !$(event.target).is(".tools-input-wrapper")){
            if($(".tools-input-wrapper").is("[active]")){
                $(".tools-input-dropdown").slideUp(200, function(){
                    $(".tools-input-wrapper").removeAttr("active");
                });
            }
        }

        if(!$(event.target).closest(".tool-container").length && !$(event.target).is(".tool-container")){
            $(".tool-container-dropdown").hide();
        }
    });

    $(".tab-body, .chat-body").each(function(){
        new slimScroll(this);
    });
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
 * Scroll To Bottom
 * Scrolls the chat body to the bottom of the page.
 */
function scrollToBottom(){
    $(".chat-body").animate({
        scrollTop: $(".chat-body").prop("scrollHeight")
    }, 300);
}


/**
 * JQuery Document Ready function. The following code is run whenever the page
 * has finished loading and is ready to work with.
 */
$(function(){


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

        send("message", {
            message: message,
            channel_id: window.channel_id,
        });
        print(false, "Chat message successfully sent to Socket IO server.");
    };


    /**
     * Handle Chat Message
     * Displays a chat message in the chat body.
     * @param {Object} data Data from Socket IO server
     */
    var handleChatMessage = function(data){
        if(!("sender_id" in data) || !("time_sent" in data) || !("message" in data)){
            print(true, "A malformed message was received from the Socket IO server. (Chat Message)");
            return;
        }

        $(".no-messages").remove();
        var mostRecent = $(".chat-body").children().last();
        var classTag = (data.sender_id == window.user_id) ? "" : "-other";
        var time = new Date(data.time_sent).toLocaleTimeString(navigator.language, {
            hour: "numeric",
            minute: "numeric",
            hour12: false,
        });

        if(mostRecent.attr("data-user-id") == data.sender_id){
            // A new message from the same user. We can safely tag.
            mostRecent.children(".chat-message-sender" + classTag).remove();
            mostRecent.append("<p class=\"chat-message-sender" + classTag + "\">" + data.sender + " (" + time + ")</p>");
            mostRecent.children("section").append("<div class=\"chat-message-content" + classTag + "-tag\" data-new></div>");
        }else{
            // From a new user, append.
            $(".chat-body").append(
                "<div class=\"chat-message-container" + classTag + "\" data-user-id=\"" + data.sender_id + "\">" +
                    "<div class=\"chat-message-image" + classTag + "\"></div>" +
                    "<span class=\"triangle-top-" + (classTag ? "right" : "left") + "\"></span>" +
                    "<section>" +
                        "<div class=\"chat-message-content" + classTag + "\" data-new></div>" +
                    "</section>" +
                    "<p class=\"chat-message-sender" + classTag + "\">" + data.sender + " (" + time + ")</p>" +
                "</div>"
            );
        }

        // Add the message afterwards via .text() to escape HTML
        $messageContent = $("[class^=\"chat-message-content\"][data-new]");
        $messageContent.text(data.message);
        $messageContent.removeAttr("data-new");

        // Make sure that the body is scrolled to the bottom
        scrollToBottom();
    }

});


addEventListenersMessenger();
scrollToBottom();
