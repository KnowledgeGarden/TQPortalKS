/**
 * Created by park on 11/26/2015.
 */
var Constants = require("../apps/constants"),
    Help = require("./helpers/helpers");

exports.plugin = function(app, environment) {
    var helpers = new Help(environment),
        isPrivatePortal = environment.getIsPrivatePortal(),
        WikiModel = environment.getWikiModel(),
        CommonModel = environment.getCommonModel();
    console.log("Wiki " + WikiModel);

    /////////////
    // Menu
    /////////////
    environment.addApplicationToMenu("/wiki", "Wiki");
    /////////////
    // Routes
    /////////////

    /**
     * Initial fetch of the /blog landing page
     */
    app.get("/wiki", helpers.isPrivate, function (req, res) {
        res.render("wikiindex", environment.getCoreUIData(req));
    });

    /**
     * GET blog index
     */
    app.get("/wiki/index", helpers.isPrivate, function (req, res) {
        var start = parseInt(req.query.start),
            count = parseInt(req.query.count),
            userId = "",
            userIP = "",
            sToken = null;
        if (req.user) {
            credentials = req.user.credentials;
        }

        WikiModel.fillDatatable(start, count, userId, userIP, sToken, function blogFill(data, countsent, totalavailable) {
            console.log("Wiki.index " + data);
            var cursor = start + countsent,
                json = environment.getCoreUIData(req);
            //pagination is based on start and count
            //both values are maintained in an html div
            json.start = cursor;
            json.count = Constants.MAX_HIT_COUNT; //pagination size
            json.total = totalavailable;
            json.table = data;
            return res.render("wikiindex", json);
        });
    });

    app.get("/wiki/:id", helpers.isPrivate, function(req, res) {
        var q = req.params.id,
            contextLocator = req.query.contextLocator;
        console.log("GETWIKI"+q);
        if (q) {
            var userId = req.session[Constants.USER_ID],
                userIP = "",
                theUser = helpers.getUser(req),
                sToken = req.session[Constants.SESSION_TOKEN];
            CommonModel.fetchTopic(q, userId, userIP, sToken, function bFT(err, rslt) {
                var data =  environment.getCoreUIData(req);
                if (rslt.cargo) {
                    //TODO populateConversationTopic
                    data = CommonModel.populateTopic(rslt.cargo, theUser);
                }
                data.locator = q;
                if (contextLocator && contextLocator !== "") {
                    data.context = contextLocator;
                } else {
                    data.context = q; // we are talking about responding to this blog
                }
                return res.render("topic", data);
            });
        } else {
            //That's not good!
            //TODO
        }
    });
    /**
     * GET new wiki post form
     */
    app.get("/wiki/new", helpers.isLoggedIn, function (req, res) {
        var data = environment.getCoreUIData(req);
        data.formtitle = "New Wiki Topic";
        data.isNotEdit = true;
        data.action = "/wiki/new";
        return res.render("blogwikiform", data);
    });

    /**
     * Function which ties the app-embedded route back to here
     */
    var _wikisupport = function (body, usx, callback) {
        if (body.locator === "") {
            WikiModel.createWikiTopic(body, usx, function (err, result) {
                return callback(err, result);
            });
        } else {
            WikiModel.update(body, usx, function (err, result) {
                return callback(err, result);
            });
        }
    };

    /**
     * POST new wiki topio
     */
    app.post("/wiki/new", helpers.isLoggedIn, function (req, res) {
        var body = req.body,
            usx = req.user;
        console.log("WIKI_NEW_POST " + JSON.stringify(usx) + " | " + JSON.stringify(body));
        _wikisupport(body, usx, function (err, result) {
            console.log("WIKI_NEW_POST-1 " + err + " " + result);
            //technically, this should return to "/" since Lucene is not ready to display
            // the new post; you have to refresh the page in any case
            return res.redirect("/wiki");
        });
    });
};