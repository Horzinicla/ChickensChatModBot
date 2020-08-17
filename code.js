ChatBot = {};

ChatBot.subStrAfterChars = function(str, char, pos) {
    if (pos == "b") return str.substring(str.indexOf(char) + 1);
    else if (pos == "a") return str.substring(0, str.indexOf(char));
    else return str;
}

ChatBot.data = {};

ChatBot.data.ranks = {
    "S10054440": 0,
    "Dracoynx gear": 1.5,
    "ProdigyMaster4116": 2,
    "YeetYeetYeetYeetYees": 2.5,
    "FoxxshadowChan": 2,
    "Bush of Electricity": 3,
    "Gacha W1Z4RD": 3,
    "Chicken's Chat Mod Bot": 4,
    "Sonic of Prodigy": 5,
    "Glaciersong": 5,
    "RobTheBobert": 5,
    "DaChickenKing": 6,
};

ChatBot.data.rankNames = {
    0: "Shameful",
    1: 'User',
    1.5: 'Rollback [bg="sandybrown"][c="white"]RB[/bg][/c]',
    2: 'Bot Helper [bg="navy"][c="white"]BOTHLP[/bg][/c]',
    2.5: 'Senior Bot Helper [bg="navy"][c="white"]BOTHLP[/bg][/c]',
    3: 'Moderator [bg="yellow"][c="white"]MOD[/bg][/c]',
    4: 'Bot',
    5: 'Admin [bg="yellow"][c="white"]SYSOP[/bg][/c]',
    6: 'Bot Owner [bg="navy"][c="white"]BOTHLP[/bg][/c]',
};

ChatBot.data.messages = {};
ChatBot.data.previousSpamKicks = [];

ChatBot.isZalgo = function(txt) {
    txt2 = decodeURIComponent(
        encodeURIComponent(txt)
        .replace(/%CC(%[A-Z0-9]{2})+%20/g, " ")
        .replace(/%CC(%[A-Z0-9]{2})+(\w)/g, "$2")
    );

    return txt2 != txt;
}

setInterval(function() {
    window.ChatBot.data.messages = {};
}, 7500);

setInterval(function() {
    window.ChatBot.previousSpamKicks = [];
}, 600000);

ChatBot.fetchLogs = function() {
    $.ajax({
        url: mw.util.wikiScript(),
        type: "GET",
        data: {
            title: "User:Chicken's Chat Mod Bot/Possible Spam",
            action: "raw",
            cb: Math.ceil(new Date().getTime() / 1000),
            dataType: "text",
        },
        success: function(data) {
            window.ChatBot.data.currentLogs = data;
        }
    });

    $.ajax({
        url: mw.util.wikiScript(),
        type: "GET",
        data: {
            title: "User:Chicken's Chat Mod Bot/Cuss Logs",
            action: "raw",
            cb: Math.ceil(new Date().getTime() / 1000),
            dataType: "text",
        },
        success: function(data) {
            window.ChatBot.data.currentCussLogs = data;
        },
    });

    $.ajax({
        url: mw.util.wikiScript(),
        type: "GET",
        data: {
            title: "User:Chicken's Chat Mod Bot/actionlog",
            action: "raw",
            cb: Math.ceil(new Date().getTime() / 1000),
            dataType: "text",
        },
        success: function(data) {
            window.ChatBot.data.actionlog = data;
        },
    });
}

ChatBot.fetchLogs();

mw.hook("dev.chat.render").add(function(mainRoom) {
    mainRoom.userMain.attributes.canPromoteModerator = true;
    mainRoom.userMain.attributes.isStaff = true;
    mainRoom.socket.bind("chat:add", function(msg) {
        var data = JSON.parse(msg.data).attrs,
            text = data.text;

        if (data.name === window.wgUserName) {
            return;
        }

        if(typeof window.ChatBot.data.messages[data.name] != "undefined") {
            window.ChatBot.data.messages[data.name]++;
        } else {
            window.ChatBot.data.messages[data.name] = 0;
        }
        

        text = text.replace(/\s{2,}/g, "").trim();

        text = text.toLowerCase();
        text = text.replace("1", "i");
        text = text.replace("$", "s");
        text = text.replace("l", "i");

        if (window.ChatBot.data.messages[data.name] >= 10) {
            window.ChatBot.data.messages[data.name] = 0;

            window.mainRoom.userMain.attributes.canPromoteModerator = true;

            window.mainRoom.kick({
                name: data.name,
            });

            txt = window.ChatBot.data.currentLogs + "<br/>" + Date(Date.now()) + " - Possible spam by " + data.name;

            if (window.ChatBot.data.previousSpamKicks.includes(data.name)) {
                mainRoom.socket.send(
                    new models.BanCommand({
                        userToBan: data.name,
                        time: 1200,
                        reason: "Spamming, even after kick",
                    }).xport()
                );
            }

            window.ChatBot.data.previousSpamKicks.push(data.name);

            try {
                $.ajax({
                    url: mw.util.wikiScript("api"),
                    type: "POST",
                    data: {
                        action: "edit",
                        title: "User:Chicken's Chat Mod Bot/Possible Spam",
                        summary: "Logged some new data",
                        text: txt,
                        bot: 1,
                        token: mw.user.tokens.get("editToken"),
                        format: "json",
                    },
                });
            } catch (e) {}

            window.ChatBot.data.actionlog = window.ChatBot.data.actionlog + "<br/>" + Date(Date.now()) + " - Action taken on " + data.name + " for spamming";

            $.ajax({
                url: mw.util.wikiScript("api"),
                type: "POST",
                data: {
                    action: "edit",
                    title: "User:Chicken's Chat Mod Bot/actionlog",
                    summary: "Logged some new data",
                    text: window.ChatBot.data.actionlog,
                    bot: 1,
                    token: mw.user.tokens.get("editToken"),
                    format: "json",
                }
            });

            $(".message > textarea")[0].value = "I think I detected spam from " + data.name + ". As a precaution, I have kicked the user and dumped the event onto one of my user sub-pages. Note that repeat offenses may result in a ban.";

            $("#ChatSendButton")[0].click();

            window.ChatBot.data.currentLogs = txt;
        }

        for (i = 0; i < window.ChatBot.data.swears.length; i++) {
            currentWord = window.ChatBot.data.swears[i];

            if (
                text == currentWord ||
                text.search(new RegExp(currentWord + "[ ,\\.\\!\\?]")) === 0 ||
                text.search(new RegExp("[ ,\\.\\!\\?]" + currentWord + "[ ,\\.\\!\\?]")) > -1 ||
                text.substr(text.length - currentWord.length - 1).search(new RegExp("[ ,\\.\\!\\?]" + currentWord)) > -1
            ) {
                window.isCuss = true;
            } else {
                if (!window.isCuss) {
                    window.isCuss = false;
                }
            }
        }

        if (window.isCuss) {
            window.mainRoom.kick({
                name: data.name,
            });

            nameofkick = data.name;

            ChatBot.fetchLogs();

            newLogs = window.ChatBot.data.currentCussLogs + "<br/>" + Date(Date.now()) + " - Possible cussing by " + nameofkick;

            if (window.ChatBot.data.previousSpamKicks.includes(nameofkick)) {
                mainRoom.socket.send(
                    new models.BanCommand({
                        userToBan: data.name,
                        time: 1200,
                        reason: "Swearing, even after kick",
                    }).xport()
                );
            }

            window.ChatBot.data.previousSpamKicks.push(nameofkick);

            try {
                $.ajax({
                    url: mw.util.wikiScript("api"),
                    type: "POST",
                    data: {
                        action: "edit",
                        title: "User:Chicken's Chat Mod Bot/Cuss Logs",
                        summary: "Logged some new data",
                        text: newLogs,
                        bot: 1,
                        token: mw.user.tokens.get("editToken"),
                        format: "json",
                    },
                });
            } catch (e) {}

            window.ChatBot.data.actionlog = window.ChatBot.data.actionlog + "<br/>" + Date(Date.now()) + " - Action taken on " + nameofkick + " for swearing";

            $.ajax({
                url: mw.util.wikiScript("api"),
                type: "POST",
                data: {
                    action: "edit",
                    title: "User:Chicken's Chat Mod Bot/actionlog",
                    summary: "Logged some new data",
                    text: window.ChatBot.data.actionlog,
                    bot: 1,
                    token: mw.user.tokens.get("editToken"),
                    format: "json",
                },
            });

            $(".message > textarea")[0].value = "I think I detected cussing from " + nameofkick + ". As a precaution, I have kicked the user and dumped the event onto one of my user sub-pages. Note that repeat offenses may result in a ban.";

            $("#ChatSendButton")[0].click();

            window.ChatBot.data.currentCussLogs = newLogs;

            delete window.isCuss;
        }
    });
});

/* Configuration */
window.ChatBot.data.swears = [
    "ass",
    "bitch",
    "boob",
    "cunt",
    "crap",
    "dick",
    "fuck",
    "penis",
    "piss",
    "pussy",
    "shit",
    "cock",
    "fck",
    "bish",
    "bishes",
    "tits",
    "sex",
    "whore",
    "hoe",
    "porn",
    "hentai",
    "stripper",
    "striper",
    "hecktai",
    "hen with a tie",
    "prn",
    "fvck",
    "cum",
    "sperm",
    "prick",
    "semen",
    "slut",
    "rape",
    "rapist",
    "cum",
    "sx",
    "tits",
    "vagina",
    "thing is big",
    "big thing",
    "nigger"
];

logInterval = 7200000;

/* Imports */
importArticle({
    type: "script",
    article: "u:dev:Chat-js.js"
});

importArticles({
    type: "script",
    articles: [
        "u:dev:MediaWiki:FucodeLogger.js",
        "u:dev:MediaWiki:ChatLogger.js"
    ]
});
