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
 * Animations
 */
var channelListIn = anime({
    targets: ".channel-list",
    duration: 80,
    easing: "easeInCubic",
    autoplay: false,
    top: ["100%", 0],
    opacity: [0, 1],
});

var channelListOut = anime({
    targets: ".channel-list",
    duration: 80,
    easing: "easeInCubic",
    autoplay: false,
    top: [0, "100%"],
    opacity: [1, 0],
});

var channelInfoIn = anime({
    targets: ".channel-info",
    duration: 80,
    easing: "easeInCubic",
    autoplay: false,
    top: ["100%", 0],
    opacity: [0, 1],
});

var channelInfoOut = anime({
    targets: ".channel-info",
    duration: 80,
    easing: "easeInCubic",
    autoplay: false,
    top: [0, "100%"],
    opacity: [1, 0],
});


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
    var createTrigger = $(".create-group");
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
    var input = $(".messenger-input");
    input.off("." + NAMESPACE);
    input.on("keydown." + NAMESPACE, function(event){
        if(event.which == 13 && !(event.shiftKey)){
            handleMessengerInput(input.text());
            input.text("");
            return false;
        }
    });

    var placeholder = $(".messenger-input-placeholder");
    input.on("focus." + NAMESPACE, function(){
        placeholder.hide();
    });

    input.on("blur." + NAMESPACE, function(){
        if(!input.text().length){ // Only show if empty
            placeholder.show();
        }
    });
    /* END CHAT */

    /* BEGIN TABS */
    var openChannelTab = $(".open-channel-tab");
    var channelList = $(".channel-list");
    openChannelTab.off("." + NAMESPACE);
    openChannelTab.on("click." + NAMESPACE, function(){
        channelListIn.play();
        channelList.attr("active", "");
    });

    var closeChannelTab = $(".channel-tab-back");
    closeChannelTab.off("." + NAMESPACE);
    closeChannelTab.on("click." + NAMESPACE, function(){
        channelListOut.play();
        channelList.removeAttr("active");
    });

    var openInfoTab = $(".open-info-tab");
    var channelInfo = $(".channel-info");
    openInfoTab.off("." + NAMESPACE);
    openInfoTab.on("click." + NAMESPACE, function(){
        channelInfoIn.play();
        channelInfo.attr("active", "");
    });

    var closeInfoTab = $(".channel-info");
    closeInfoTab.off("." + NAMESPACE);
    closeInfoTab.on("click." + NAMESPACE, function(){
        channelInfoOut.play();
        channelInfo.removeAttr("active");
    });
    /* END TABS */

    /* BEGIN CHANNEL LIST */
    var channelWrappers = $(".chnl-wrapper");
    channelWrappers.off("." + NAMESPACE);
    channelWrappers.on("click." + NAMESPACE, function(){
        channelWrappers.removeAttr("active");
        $(this).closest(".chnl-wrapper").attr("active", "");
        if(channelList.is("[active]")){
            channelListOut.play();
            channelList.removeAttr("active");
        }
    });
    /* END CHANNEL LIST */

    /* BEGIN DOCUMENT */
    $("html").off("." + NAMESPACE);
    $("html").on("click." + NAMESPACE, handleMessengerDocumentEvent);
    /* END DOCUMENT */
}


/**
 * Handle Messenger Document Event
 * Click event that always fires. Not currently used.
 */
function handleMessengerDocumentEvent(event){
    var target = $(event.target);

    /* BEGIN TABS
    if($(".channel-list").is("[active]")){
        if(target.closest(".channel-list").length ||
           target.is(".channel-list") ||
           target.closest(".open-channel-tab").length ||
           target.is(".open-channel-tab")){
            return;
        }

        $(".channel-list").removeAttr("active");
        channelListOut.play();
    }
    /* END TABS */
}


$(document).on("pjax:success", function(){
    initMessenger(false);
});

$(document).on("ready", function(){
    initMessenger(true);
});


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
    var mostRecent = $(".messenger-body").children().last();
    var origin = (senderID != window.user_id) ? "left" : "right";
    var time = new Date(timeSent).toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    });

    if(mostRecent.attr("data-user-id") == senderID){
        $(".messenger-body").append(
            "<div class='message-wrapper' data-" + origin + " data-sender='" + sender + "' data-user-id='" + senderID + "'>" +
                "<div class='message-content-wrapper'>" +
                    "<p class='message-content' data-new></p>" +
                "</div>" +
            "</div>"
        );
    }else{
        $(".messenger-body").append(
            "<div class='message-wrapper' data-" + origin + " data-image data-sender='" + sender + "' data-user-id='" + senderID + "'>" +
                "<div class='message-image'></div>" +
                "<div class='message-content-wrapper'>" +
                    "<p class='message-content' data-new></p>" +
                "</div>" +
            "</div>"
        );
    }

    // Add the message afterwards via .text() to escape HTML
    messageContent = $(".message-content[data-new]");
    messageContent.text(message);
    messageContent.removeAttr("data-new");

    // Make sure that the body is scrolled to the bottom
    scrollToBottom($(".messenger-body"));
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


/* BEGIN INPUT */
/**
 * Handle Messenger Input
 * Handles user input from the messenger.
 * @param {String} input Contents of the input.
 */
function handleMessengerInput(input){
    input = input.trim(); // Remove excessive whitespace
    var re = /^\//; // Matches the literal '/'
    if(re.test(input)){
        parseCommand(input); // Parse command
        return;
    }

    if(input.length){  // Make sure the string isn't empty.
        sendSocketMessage(input);
        appendMessage(input, window.username, window.user_id, Date.now());
    }
}


/**
 * Parse Command
 * Parses and handles commands.
 * @param {String} command Command to be parsed.
 */
function parseCommand(command){
    print("Parsing command: '" + command + "'");
}
/* END INPUT */
