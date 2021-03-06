/**
 * Created by park on 11/25/2015.
 */
var Constants = require("../apps/constants"),
    Help = require("./helpers/helpers");

exports.plugin = function(app, environment) {
    var helpers = new Help(environment),
        UserModel = environment.getUserModel(),
        CommonModel = environment.getCommonModel();

    console.log("User " + UserModel);

    /////////////
    // Menu
    /////////////
    environment.addApplicationToMenu("/user", "Gardeners");
    /////////////
    // Routes
    /////////////

    /**
     *
     */
    app.get("/user", helpers.isPrivate, function (req, res) {
        var data =  environment.getCoreUIData(req);
        data.start=0;
        UserModel.listUsers(0, -1, function uLU(err, rslt) {
            if (rslt.cargo) {
                data.cargo = rslt.cargo;
            }
            return res.render("userindex", data);
        });

    });

    app.get("/user/:id", helpers.isPrivate, function (req, res) {
        var q = req.params.id;
        if (q) {
            var userId = helpers.getUserId(req), //req.session[Constants.USER_ID],
                userIP = "",
                theUser = helpers.getUser(req),
                sToken = req.session[Constants.SESSION_TOKEN];
            CommonModel.fetchTopic(q, userId, userIP, sToken, function uFT(err, rslt) {
                var data =  environment.getCoreUIData(req),
                    usx = helpers.getUser(req),
                    credentials = usx.uRole;
                if (rslt.cargo) {
                    data = CommonModel.populateTopic(rslt.cargo, theUser, data);
                }
                if (credentials) {
                  var x = false,
                      where = credentials.indexOf(q);
                  if (where < 0) {
                    var where2 = credentials.indexOf(Constants.ADMIN_CREDENTIALS);
                    if (where2 > -1) {x = true;}
                  } else {
                    x = true;
                  }
                  data.canEdit = x;
                  if (x) {
                      data.editurl = "/useredit/"+q;
                  }
                }
                return res.render("topic", data);
            });
        } else {
            //That's not good!
            //TODO  alert stuff
            console.log("DANG "+q);
            req.flash("error", "Cannot get "+q);
            res.redirect("/");
        }
    });

    app.get("/useredit/:id", helpers.isLoggedIn, function(req, res) {
      var q = req.params.id,
          contextLocator = req.query.contextLocator,
          language = "en"; //TODO we need to deal with language
      console.log("UserEdit "+q+" "+contextLocator);
      if (q) {
          var userId = helpers.getUserId(req), //req.session[Constants.USER_ID],
              theUser = helpers.getUser(req),
              userIP = "",
              sToken = req.session[Constants.SESSION_TOKEN];
          CommonModel.fetchTopic(q, userId, userIP, sToken, function bFT(err, rslt) {
              var data =  environment.getCoreUIData(req);
              if (rslt.cargo) {
                console.log("CARGO "+JSON.stringify(rslt.cargo));
                data.action = "/user/edit";
                data.formtitle = "Edit User Node";
                data.locator = q; // this makes the form know it's for editing
                data.title = "Title editing is disabled"; //rslt.cargo.label;
                data.language = language;
                data.body = rslt.cargo.details;
                //TODO
                return res.render("blogwikiform", data);
              }
          });
        } else {
            //That's not good!
            req.flash("error", "Cannot get "+q);
            res.redirect("/");
        }
    });

    app.post("/user/edit", helpers.isLoggedIn, function(req, res) {
      var body = req.body,
          userId = helpers.getUserId(req), //req.session[Constants.USER_ID],
          userIP = "",
          sToken = req.session[Constants.SESSION_TOKEN];
      console.log("UserEditPost "+JSON.stringify(body));
      UserModel.update(body, userId, userIP, sToken, function blSB(err, result) {
         console.log("USER_EDIT_POST-2 "+err+" "+result);
         //technically, this should return to "/" since Lucene is not ready to display
         // the new post; you have to refresh the page in any case
         return res.redirect("/user");
      });
    });

};
