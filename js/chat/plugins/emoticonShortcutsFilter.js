/**
 * Emoticon Shortcuts filter (:) -> :smile:)
 *
 * @param megaChat
 * @returns {EmoticonShortcutsFilter}
 * @constructor
 */
var EmoticonShortcutsFilter = function(megaChat) {
    var self = this;

    self.shortcuts = {
        ':)': ':slight_smile:',
        ':-)': ':slight_smile:',
        ':d': ':grinning:',
        ':-d': ':grinning:',
        ';)': ':wink:',
        ';-)': ':wink:',
        ';p': ':stuck_out_tongue_winking_eye:',
        ';-p': ':stuck_out_tongue_winking_eye:',
        ':p': ':stuck_out_tongue:',
        ':-p': ':stuck_out_tongue:',

        ':(': ':disappointed:',
        ':\\': ':confused:',
        ':/': ':confused:',
        ':|': ':neutral_face:',
        'd:': ':anguished:'
    };


    //RegExpEscape
    var escapedRegExps = [];
    $.each(self.shortcuts, function(shortcut, expanded) {

        escapedRegExps.push(
            "(^|\\W?)(" + RegExpEscape(shortcut) + ")(?=(\\s|$))"
        );
    });

    var regExpStr = "(" + escapedRegExps.join("|") + ")";
    
    self.emoticonsRegExp = new RegExp(regExpStr, "gi");

    megaChat.bind("onBeforeRenderMessage", function(e, eventData) {
        self.processMessage(e, eventData);
    });

    return this;
};

EmoticonShortcutsFilter._strStartsWithNSpaces = function(string) {
    for (var i = 0; i < string.length; i++) {
        if (string[i] !== " " && string[i] !== "\t" && string[i] !== "\n" && string[i] !== "\r") {
            return i;
        }
    }
    return string.length;
};

EmoticonShortcutsFilter._strEndsWithNSpaces = function(string) {
    for (var i = string.length - 1; i >= 0; i--) {
        if (string[i] !== " " && string[i] !== "\t" && string[i] !== "\n" && string[i] !== "\r") {
            return string.length - i - 1;
        }
    }
    return 0;
};

EmoticonShortcutsFilter.prototype.processMessage = function(e, eventData) {
    var self = this;

    // ignore if emoticons are already processed
    if (eventData.message.emoticonShortcutsProcessed === true) {
        return;
    }

    // use the HTML version of the message if such exists (the HTML version should be generated by hooks/filters on the
    // client side.
    var textContents;
    if (eventData.message.getContents) {
        textContents = eventData.message.getContents();
    } else {
        textContents = eventData.message.textContents;
    }


    var messageContents = eventData.message.messageHtml ? eventData.message.messageHtml : textContents;

    if (!messageContents) {
        return; // ignore, maybe its a system message (or composing/paused composing notification)
    }

    messageContents = messageContents.replace(self.emoticonsRegExp, function(match) {
        var foundSlug = $.trim(match.toLowerCase());
        var startingSpaces = EmoticonShortcutsFilter._strStartsWithNSpaces(match);
        var prefix = "";
        var whatsLeftStr = match;
        if (startingSpaces !== 0) {
            whatsLeftStr = match.substr(startingSpaces);
            prefix = match.substr(0, startingSpaces);
        }

        var endingSpaces = EmoticonShortcutsFilter._strEndsWithNSpaces(whatsLeftStr);

        var suffix = "";
        if (endingSpaces !== 0) {
            suffix = whatsLeftStr.substr(endingSpaces);
        }

        return self.shortcuts[foundSlug] ?
            prefix + self.shortcuts[foundSlug] + suffix :
            match;
    });

    eventData.message.messageHtml = messageContents;
    eventData.message.emoticonShortcutsProcessed = true;
};
