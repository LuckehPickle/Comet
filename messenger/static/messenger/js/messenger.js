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

/** @const */ var NAMESPACE = "messenger";
var createModal;


/**
 * Init Messenger
 * Initialises messenger related functions.
 * @param {Boolean} fullLoad Determines whether the page was a PJAX load.
 */
function initMessenger(fullLoad){
    if(createModal == null)
        createModal = new Modal("create", $(".modal-create"));

    if(!fullLoad){ // If this is a PJAX load we only want to add event handlers.
        addMessengerEventListeners(fullLoad);
        return;
    }

    print("Initialising Messenger...");

    scrollToBottom($(".chat-body"));
    addMessengerEventListeners(fullLoad);

    print("Initialised Messenger.");
}


/**
 * Add Messenger Event Listeners
 * Initialises event listeners for things on the messenger page.
 * @param {Boolean} fullLoad Determines whether the page was a PJAX load.
 */
function addMessengerEventListeners(fullLoad){
    /* BEGIN CREATE MODAL */
    var createTrigger = $(".create-group-trigger");
    createTrigger.off("." + NAMESPACE);
    createTrigger.on("click." + NAMESPACE, function(){
        if(createModal == null)
            createModal = new Modal("create", $(".modal-create"));
        createModal.display();
    });

    var createCancel = $(".modal-create-cancel");
    createCancel.off("." + NAMESPACE);
    createCancel.on("click." + NAMESPACE, function(){
        createModal.hide();
    });
    /* END CREATE MODAL */

    /* BEGIN CHAT */
    var chatForm = $(".chat-form");
    chatForm.off("submit");
    chatForm.submit(function(){
        sendSocketMessage($(".chat-form-input").text());
        $(".chat-form-input").text("");
        return false; // Prevents the form from submitting
    });

    var chatFormInput = $(".chat-form-input");
    chatFormInput.off("." + NAMESPACE);
    chatFormInput.on("keydown." + NAMESPACE, function(event){
        if(event.which == 13){ // Enter key press
            chatForm.submit();
            return false;
        }
    });

    var chatSend = $(".chat-send");
    chatSend.off("." + NAMESPACE);
    chatSend.on("click." + NAMESPACE, function(){
        chatForm.submit();
    });
    /* END CHAT */

    /* BEGIN TABS */
    var tabHeads = $(".tab-head");
    tabHeads.off("." + NAMESPACE);
    tabHeads.on("click." + NAMESPACE, function(event){
        openTab($(this));
    });

    var tabContainers = $(".friend-container, .group-container");
    tabContainers.off("." + NAMESPACE);
    tabContainers.on("click." + NAMESPACE, function(){
        tabContainers.removeAttr("active");
        if(!$(this).is("[active]")){
            $(this).attr("active", "");
        }
    });
    /* END TABS */

    /* BEGIN DOCUMENT - Not currrently necessary.
    $("html").off("." + NAMESPACE);
    $("html").on("click." + NAMESPACE, handleMessengerDocumentEvent);
     END DOCUMENT */
}


/**
 * Handle Messenger Document Event
 * Click event that always fires. Not currently used.
 */
function handleMessengerDocumentEvent(event){
    var target = $(event.target);
}


$(document).on("pjax:success", function(){
    initMessenger(false);
});

$(document).on("ready", function(){
    initMessenger(true);
});


/* BEGIN TABS */
/**
 * Open Tab
 * Closes all tabs, then opens the tab-head that is passed.
 * @param {Element} tab The 'tab-head' or 'tab-body' to be opened.
 */
function openTab(tab){
    $(".tab-head[active], .tab-body[active]").removeAttr("active");
    $("[data-tab=\"" + tab.attr("data-tab") + "\"]").attr("active", "");
    print("Opened tab with id '" + tab.attr("data-tab") + "'")
}
/* END TABS */


/* BEGIN CHAT */
/**
 * Append Message
 * Adds a new message to the chat body.
 * @param {String} message Body of the message.
 * @param {String} sender Name of sender.
 * @param {String} senderID UUID of the sender.
 * @param {String} timeSent Time that the message was sent.
 */
function appendMessage(message, sender, senderID, timeSent){
    $(".no-messages").remove();
    var mostRecent = $(".chat-body").children().last();
    var classTag = (senderID == window.user_id) ? "" : "-other";
    var time = new Date(timeSent).toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    });

    if(mostRecent.attr("data-user-id") == senderID){
        // A new message from the same user. We can safely tag.
        mostRecent.children(".chat-message-sender" + classTag).remove();
        mostRecent.append("<p class=\"chat-message-sender" + classTag + "\">" + sender + " (" + time + ")</p>");
        mostRecent.children("section").append("<div class=\"chat-message-content" + classTag + "-tag\" data-new></div>");
    }else{
        // From a new user, append.
        $(".chat-body").append(
            "<div class=\"chat-message-container" + classTag + "\" data-user-id=\"" + senderID + "\">" +
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
/* END CHAT */


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
    var query = $(".search input").val();
    requestQueryResponse(query);
};
/* END SEARCH */
