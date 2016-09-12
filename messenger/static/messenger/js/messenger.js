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
/** @const */ var SEARCH_TYPING_INTERVAL = 100; // How long should typing last (milliseconds)
/** @const */ var PUSH_TIMEOUT = 8000;
var searchTimer;

/**
 * Animations
 */
var channelListIn = anime ({
    targets: ".channel-list",
    duration: 100,
    easing: "easeInCubic",
    autoplay: false,
    top: ["100%", 0],
    opacity: [0, 1],
});

var channelListOut = anime ({
    targets: ".channel-list",
    duration: 100,
    easing: "easeInCubic",
    autoplay: false,
    top: [0, "100%"],
    opacity: [1, 0],
});

var channelInfoIn = anime ({
    targets: ".channel-info",
    duration: 100,
    easing: "easeInCubic",
    autoplay: false,
    top: ["100%", 0],
    opacity: [0, 1],
});

var channelInfoOut = anime ({
    targets: ".channel-info",
    duration: 100,
    easing: "easeInCubic",
    autoplay: false,
    top: [0, "100%"],
    opacity: [1, 0],
});


/**
 * Init Messenger
 * Initialises messenger related functions.
 * @param {Boolean} isFullLoad Determines whether the page was a PJAX load.
 */
function initMessenger(isFullLoad) {
    
    if (isFullLoad) {
        print("Initialising page with namespace: " + NAMESPACE);
    }
    
    addMessengerEventListeners(isFullLoad);
    var messengerContent = $(".messenger-content");
    scrollToBottom(messengerContent);
    
    print("Initialised page with namespace: " + NAMESPACE);
    
}


/**
 * Add Messenger Event Listeners
 * Initialises event listeners for things on the messenger page.
 * @param {Boolean} fullLoad Determines whether the page was a PJAX load.
 */
function addMessengerEventListeners(fullLoad) {
    
    // Remove event listeners.
    $(document).off("." + NAMESPACE);

    /* BEGIN CREATE MODAL */
    var createTrigger = $(".create-group");
    createTrigger.off("." + NAMESPACE);
    createTrigger.on("click." + NAMESPACE, function() {
        if (createModal == null)
            createModal = new Modal("create", $(".modal-create"));
        createModal.display();
    });

    var createCancel = $(".modal-create-cancel");
    createCancel.off("." + NAMESPACE);
    createCancel.on("click." + NAMESPACE, function() {
        createModal.hide();
    });
    /* END CREATE MODAL */

    /* BEGIN MESSENGER */
    var input = $(".messenger-input");
    input.off("." + NAMESPACE);
    input.on("keydown." + NAMESPACE, function(event) {
        if (event.which == 13 && !(event.shiftKey)) {
            handleMessengerInput(input.text());
            input.text("");
            return false;
        }
    });

    var placeholder = $(".messenger-input-placeholder");
    input.on("focus." + NAMESPACE, function() {
        placeholder.hide();
    });

    input.on("blur." + NAMESPACE, function() {
        if (!input.text().length) { // Only show if empty
            placeholder.show();
        }
    });

    var messageContent = $(".message-content");
    messageContent.off("." + NAMESPACE);
    messageContent.on("click." + NAMESPACE, function() {
        if ($(this).is("[active]")) {
            $(this).removeAttr("active");
        } else {
            $(this).attr("active", "");
        }
    });
    /* END MESSENGER */

    /* BEGIN TABS */
    var openChannelTab = $(".open-channel-tab");
    var channelList = $(".channel-list");
    openChannelTab.off("." + NAMESPACE);
    openChannelTab.on("click." + NAMESPACE, function() {
        channelListIn.play();
        channelList.attr("active", "");
    });

    var closeChannelTab = $(".channel-tab-back");
    closeChannelTab.off("." + NAMESPACE);
    closeChannelTab.on("click." + NAMESPACE, function() {
        channelListOut.play();
        channelList.removeAttr("active");
    });

    var openInfoTab = $(".open-info-tab");
    var channelInfo = $(".channel-info");
    openInfoTab.off("." + NAMESPACE);
    openInfoTab.on("click." + NAMESPACE, function() {
        channelInfoIn.play();
        channelInfo.attr("active", "");
    });

    var closeInfoTab = $(".channel-info-back");
    closeInfoTab.off("." + NAMESPACE);
    closeInfoTab.on("click." + NAMESPACE, function() {
        channelInfoOut.play();
        channelInfo.removeAttr("active");
    });
    /* END TABS */

    /* BEGIN CHANNEL LIST */
    var channelWrappers = $(".chnl-wrapper");
    channelWrappers.off("." + NAMESPACE);
    channelWrappers.on("click." + NAMESPACE, function() {
        channelWrappers.removeAttr("active");
        $(this).closest(".chnl-wrapper").attr("active", "");
        if (channelList.is("[active]")) {
            channelListOut.play();
            channelList.removeAttr("active");
        }
    });
    /* END CHANNEL LIST */

    /* BEGIN SEARCH */
    var searchResults = $(".search-results");
    var searchInput = $(".search-input");
    searchInput.off("." + NAMESPACE);
    searchInput.on("keyup." + NAMESPACE, function(event) {
        if (event.which == 16 || // Shift
            event.which == 17 || // Ctrl
            event.which == 18) { // Alt
            return;
        }

        clearTimeout(searchTimer);
        searchTimer = setTimeout(searchComplete, SEARCH_TYPING_INTERVAL);

        var query = searchInput.val().trim();
        if (!query.length) { // Query is empty, show channel list.
            searchResults.hide();
            searchResults.removeAttr("active");
            $(".channel-list-inner").fadeIn(100);
        } else if (query.length && !searchResults.is("[active]")) {
            $(".channel-list-inner").hide();
            searchResults.fadeIn(100);
            searchResults.attr("active", "");
        }

        if (query.length < 2) { // Search not long enough.
            removeStaleSearches();
            $(".search-content").append("<p class=\"search-no-results\">Search not long enough.</p>");
        }
    });

    searchInput.on("keydown." + NAMESPACE, function(event) {
        if (event.which == 16 || // Shift
            event.which == 17 || // Ctrl
            event.which == 18) { // Alt
            return;
        }
        clearTimeout(searchTimer);
    });

    var search = $(".search");
    search.off("." + NAMESPACE);
    search.on("click." + NAMESPACE, function() {
        searchInput.focus();
    });
    /* END SEARCH */

    /* BEGIN CHANNEL INFO */
    var username = $(".message-user-name");
    username.off("." + NAMESPACE);
    username.on("click." + NAMESPACE, function() {
        retrieveUserProfile($(this).parent().attr("data-sender-id"));
    });

    var infoClose = $(".channel-info-close");
    infoClose.off("." + NAMESPACE);
    infoClose.on("click." + NAMESPACE, function() {
        infoClose.css("visibility", "hidden");
        $(".channel-info-inner").fadeIn(150);
        $(".retrieved-info").hide();
    });
    /* END CHANNEL INFO */
    
    /* BEGIN USER DROPDOWN */
    var userDropdown = $(".user-dropdown-outer");
    userDropdown.on("click." + NAMESPACE, function() {
        userDropdown.removeAttr("active");
        $("body").append(userDropdown);
    });
    
    var addFriend = $(".user-dropdown-outer .add-friend");
    addFriend.on("click." + NAMESPACE, function() {
        var wrapper = $(this).closest(".search-user-wrapper");
        sendFriendRequest(wrapper.attr("data-user-id"));
        clearSearch();
    });
    
    var acceptRequest = $(".user-dropdown-outer .accept-request");
    acceptRequest.on("click." + NAMESPACE, function() {
        var wrapper = $(this).closest(".search-user-wrapper");
        answerFriendRequest(true, wrapper.attr("data-user-id"));
        clearSearch();
    });
    
    var denyRequest = $(".user-dropdown-outer .deny-request");
    denyRequest.on("click." + NAMESPACE, function() {
        var wrapper = $(this).closest(".search-user-wrapper");
        answerFriendRequest(false, wrapper.attr("data-user-id"));
        clearSearch();
    });
    
    var viewProfile = $(".user-dropdown-outer .view-profile");
    viewProfile.on("click." + NAMESPACE, function() {
        var wrapper = $(this).closest(".search-user-wrapper");
        retrieveUserProfile(wrapper.attr("data-user-id"));
        clearSearch();
    });
    
    var removeFriend = $(".user-dropdown-outer .remove-friend");
    removeFriend.on("click." + NAMESPACE, function() {
        var wrapper = $(this).closest(".search-user-wrapper");
        send("remove_friend", wrapper.attr("data-user-id"));
        clearSearch();
    });
    
    var cancelRequest = $(".user-dropdown-outer .request-sent");
    cancelRequest.on("click." + NAMESPACE, function() {
        var wrapper = $(this).closest(".search-user-wrapper");
        send("cancel_friend_request", wrapper.attr("data-user-id"));
        clearSearch();
    });
    /* END USER DROPDOWN */

    /* BEGIN DOCUMENT */
    $("html").off("." + NAMESPACE);
    $("html").on("click." + NAMESPACE, handleMessengerDocumentEvent);
    /* END DOCUMENT */
}


/**
 * Handle Messenger Document Event
 * Click event that always fires. Not currently used.
 */
function handleMessengerDocumentEvent(event) {
    var target = $(event.target);

    if (!target.closest(".message-content").length && !target.is(".message-content")) {
        $(".message-content").removeAttr("active");
    }
    
    if (!target.closest(".search-user-more").length && !target.is(".search-user-more")) {
        $(".user-dropdown-outer").removeAttr("active");
        $("body").append($(".user-dropdown-outer"));
    }
}


$(document).on("pjax:success", function() {
    initMessenger(false);
});

$(document).on("ready", function() {
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
function appendMessage(message, sender, senderID, timeSent) {
    $(".no-messages").remove();
    var mostRecent = $(".messenger-content").children(".message-wrapper").last();
    var origin = (senderID != window.user_id) ? "left" : "right";
    var time = new Date(timeSent).toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    });

    if (mostRecent.attr("data-user-id") == senderID) {
        mostRecent.after(
            "<div class='message-wrapper' data-" + origin + " data-user-id='" + senderID + "'>" +
                "<div class='message-content-wrapper'>" +
                    "<p class='message-content' data-new></p>" +
                "</div>" +
            "</div>"
        );
    } else {
        $(".messenger-content").append(
            "<div class='message-wrapper' data-" + origin + " data-image data-user-id='" + senderID + "'>" +
                "<div class='message-image'></div>" +
                "<div class='message-content-wrapper'>" +
                    "<p class='message-content' data-new></p>" +
                "</div>" +
            "</div>"
        );

        $(".messenger-content").append(
            "<div class=\"message-user-wrapper\" data-" + origin + " data-sender-id='" + senderID + "'>" +
                "<p class=\"message-user-name noselect\" data-new>" + sender + "</p>" +
            "</div>"
        );

        $(".message-user-name[data-new]").on("click." + NAMESPACE, function() {
            retrieveUserProfile($(this).parent().attr("data-sender-id"));
        });

        $(".message-user-name[data-new]").removeAttr("data-new");
    }

    // Add the message afterwards via .text() to escape HTML
    messageContent = $(".message-content[data-new]");
    messageContent.text(message);
    messageContent.removeAttr("data-new");

    // Make sure that the body is scrolled to the bottom
    scrollToBottom($(".messenger-content"));
}
/* END CHAT */


/* BEGIN SEARCH */
/**
 * Update Search
 * Removes stale search data and adds the latest data from the server.
 * @param {JSON} users A list of users that mach the query
 * @param {Object} friends A dict of friend statuses
 */
function updateSearch(users, friends) {
    $(".user-dropdown-outer").removeAttr("active");
    $("body").append($(".user-dropdown-outer"));
    
    removeStaleSearches();

    if (users.length == 0) {
        // No data returned
        $(".search-content").append("<p class=\"search-no-results\">No results found.</p>");
        return;
    }

    // Iterate over each user
    jQuery.each(users, function() {
        // Defaults
        var innerHTML = "User";

        if (this.pk in friends) {
            switch (friends[this.pk]) {
                case "friend":
                    innerHTML = "Friends";
                    break;
                case "request_sent":
                    innerHTML = "Friend Request Sent";
                    break;
                case "request_received":
                    innerHTML = "Friend Request Received";
                    break;
            }
        }

        // Add search result
        $(".search-content").append(
            "<div class=\"search-user-wrapper noselect\" href=\"/messages/user/" + this.fields.user_url + "\" data-pjax-messenger data-relationship=\"" + friends[this.pk] + "\" data-user-id=\"" + this.pk + "\">" +
                "<div class=\"search-user-image\"></div>" +
                "<div class=\"search-user-info\">" +
                    "<p class=\"search-user-name\">" + this.fields.username + " (" + this.pk.substring(0, 8).toUpperCase() + ")</p>" +
                    "<p class=\"search-user-friend-status\">" + innerHTML + "</p>" +
                "</div>" +
                "<i class=\"search-user-more material-icons\" data-new>more_vert<link class=\"rippleJS\"></i>" +
            "</div>"
        );
        
        $(".search-user-more[data-new]").on("click", function(event) {
            var target = $(event.target);
            if (target.is(".user-dropdown-outer") || !!target.closest(".user-dropdown-outer").length) {
                return;
            }
            
            if (!!$(this).children(".user-dropdown-outer").length) {
                $(".user-dropdown-outer").removeAttr("active");
                $("body").append($(".user-dropdown-outer"));
                return;
            }
            
            var userMenu = $(".user-dropdown-outer");
            var innerMenu = $(".user-dropdown-outer .menu-inner");
            var userRelationship = $(this).closest(".search-user-wrapper").attr("data-relationship");
            $(this).append(userMenu);
            userMenu.attr("active", "");
            innerMenu.children().removeAttr("active");
            
            switch (userRelationship + "") {
                case "undefined":
                    innerMenu.children(".add-friend, .view-profile, .invite-to-group").attr("active", "");
                    break;
                case "friend":
                    innerMenu.children(".send-message, .view-profile, .invite-to-group, .remove-friend").attr("active", "");
                    break;
                case "request_sent":
                    innerMenu.children(".request-sent, .view-profile, .invite-to-group").attr("active", "");
                    break;
                case "request_received":
                    innerMenu.children(".accept-request, .deny-request, .view-profile, .invite-to-group").attr("active", "");
                    break;
            }
            
            var url = userMenu.closest(".search-user-wrapper").attr("href");
            $(".user-dropdown-outer .send-message").attr("href", url);
        });
        
        $(".search-user-more[data-new]").removeAttr("data-new");
    });

    // Add "See all results" button.
    $(".search-content").append(
        "<a class=\"search-all-results noselect\">" +
            "See all results." +
            "<link class=\"rippleJS\">" +
        "</a>"
    );
};


/**
 * Remove Stale Searches
 * Clears the search list of any stale data.
 */
var removeStaleSearches = function() {
    var children = $(".search-content").children();
    children.each(function() {
        $(this).remove();
    });
};


/**
 * Search Complete
 * Function which runs whenever the typing timer runs out. It essentially
 * means the user has finished typing.
 */
function searchComplete () {
    var query = $(".search-input").val().trim();
    if (query != "" && query != null && query.length > 1) {
        send("search", query);
        print("Sent a query for users named '" + query + "'");
    }
};


/**
 * Clear Search
 */
function clearSearch () {
    $(".search-input").val("");
    $(".search-results").hide();
    $(".search-results").removeAttr("active");
    $(".channel-list-inner").fadeIn(100);
}
/* END SEARCH */


/* BEGIN INPUT */
/**
 * Handle Messenger Input
 * Handles user input from the messenger.
 * @param {String} input Contents of the input.
 */
function handleMessengerInput(input) {
    input = input.trim(); // Remove excessive whitespace
    var re = /^\//; // Matches the literal '/'
    if (re.test(input)) {
        parseCommand(input); // Parse command
        return;
    }

    if (input.length) { // Make sure the string isn't empty.
        if (window.channel_url == null) {
            print("Attempted to send a message but not currently connected to a channel.", true);
            return;
        }

        data = {
            channel_url: window.channel_url,
            message: input,
        }

        send("message", data);
        appendMessage(input, window.username, window.user_id, Date.now());
        print("Message sent to socket server.");
    }
}


/**
 * Parse Command
 * Parses and handles commands.
 * @param {String} command Command to be parsed.
 */
function parseCommand(command) {
    print("Parsing command: '" + command + "'");
}
/* END INPUT */


/* BEGIN CHANNEL INFO */
/**
 * Retrieve User Profile
 * @param {String} user_id Target users ID.
 */
function retrieveUserProfile(user_id) {
    // Make sure panel is visible
    channelInfoIn.play();
    $(".channel-info").attr("active", "");
    $(".channel-info-close").css("visibility", "visible");

    send("user_profile", user_id);
    print("Retrieving user profile...");

    var panel = $(".retrieved-info");
    var panelContent = $(".retrieved-info-content");
    $(".channel-info-inner").hide();
    panelContent.children().remove();
    panel.fadeIn(150);

    panelContent.append(
        "<p class=\"no-messages\">Retrieving user profile...</p>" +
        "<div class=\"sk-folding-cube channel-info-loader\">" +
            "<div class=\"sk-cube1 sk-cube\"></div>" +
            "<div class=\"sk-cube2 sk-cube\"></div>" +
            "<div class=\"sk-cube4 sk-cube\"></div>" +
            "<div class=\"sk-cube3 sk-cube\"></div>" +
        "</div>"
    );
}


/**
 * Handle Socket User Profile
 * TODO Show close icon.
 * TODO Right-click/long press menu with additional options.
 */
function handleSocketUserProfile(data) {
    if (!("user_data" in data)) {
        print("A malformed message was received from the SocketIO server. (User Profile)", true);
        return;
    }

    print("User profile retrieved.");

    var userData = data.user_data;
    var out = "";

    out += "<p class=\"user-profile-username\">" + userData.username + "</p>";
    out += "<p class=\"user-profile-userid\">" + userData.user_id + "</p>";
    out += "<div class=\"user-profile-image\"></div>";
    out += "<p class=\"user-profile-bio\"><span>User Bio:</span><br>" + userData.user_bio + "</p>";

    switch (userData.relationship) {
        case "none":
            out += "<div class=\"user-profile-button add-friend\" data-new>Add Friend</div>";
            break;
        case "friend":
            out += "<div class=\"user-profile-button remove-friend\" data-new>Remove Friend</div>";
            out += "<a class=\"user-profile-button send-message\" href=\"" + userData.user_url + "\" data-pjax-messenger data-new>Message</a>"
            break;
        case "request_sent":
            out += "<div class=\"user-profile-button cancel-request\" data-new>Cancel Request</div>";
            break;
        case "request_received":
            out += "<div class=\"user-profile-button accept-request\" data-new>Accept Request</div>";
            out += "<div class=\"user-profile-button deny-request\" data-new>Deny Request</div>";
            break;
    }

    var panel = $(".retrieved-info-content");
    panel.children().remove();
    panel.attr("data-user-id", userData.user_id);
    panel.append(out);
    
    $(".add-friend[data-new]").on("click", function (){
        var id = $(this).closest(".retrieved-info-content").attr("data-user-id");
        sendFriendRequest(id);
        retrieveUserProfile(id);
    });
    $(".add-friend[data-new]").removeAttr("data-new");
    
    $(".remove-friend[data-new]").on("click", function (){
        var id = $(this).closest(".retrieved-info-content").attr("data-user-id");
        send("remove_friend", id);
        retrieveUserProfile(id);
    });
    $(".remove-friend[data-new]").removeAttr("data-new");
    
    $(".accept-request[data-new]").on("click", function (){
        var id = $(this).closest(".retrieved-info-content").attr("data-user-id");
        answerFriendRequest(true, id);
        retrieveUserProfile(id);
    });
    $(".accept-request[data-new]").removeAttr("data-new");
    
    $(".deny-request[data-new]").on("click", function (){
        var id = $(this).closest(".retrieved-info-content").attr("data-user-id");
        answerFriendRequest(false, id);
        retrieveUserProfile(id);
    });
    $(".deny-request[data-new]").removeAttr("data-new");
    
    $(".cancel-request[data-new]").on("click", function (){
        var id = $(this).closest(".retrieved-info-content").attr("data-user-id");
        send("cancel_friend_request", id);
        retrieveUserProfile(id);
    });
    $(".cancel-request[data-new]").removeAttr("data-new");
    
    $(".send-message[data-new]").on("click", function (){
        $(".channel-info-close").click();
    });
    $(".send-message[data-new]").removeAttr("data-new");
}
/* END CHANNEL INFO */
