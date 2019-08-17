const express = require('express');
const app = express();
var path = require('path');
const handlebars = require('express-handlebars');
const db = require('./utils/db');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bc = require('./utils/bc');
const {notLoggedIn, loggedIn} = require('./middleware');
//const ifUserIsUser = require('./utils/db');
// const csurf = require("csurf");

app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(express.static('./'));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname, 'views'));
app.engine(
    "handlebars",
    handlebars({
        defaultLayout: "main"
    })
);

app.use((request, response, next) => {
    //response.locals.csrfToken = request.csrfToken();
    response.set("x-frame-options"), "deny";
    response.locals.userId = request.session.userId;
    response.locals.userFirstName = request.session.userFirstName;
    response.locals.userLastName = request.session.userLastName;
    db.getAmountSigners().then(results => {
        response.locals.amountSigned = results.rows[0].count;
        console.log(
            "response.locals.amountSigned:",
            response.locals.amountSigned
        );
    });
    next(); //means you can keep going down
});

app.set("view engine", "handlebars");

app.get("/", function(request, response) {
    response.render("login", {}); //this is the template that will be rendered. default is the folder named views.
});

app.get("/deletesignature", function(request, response) {
    response.render("deletesignature", {}); //this is the template that will be rendered. default is the folder named views.
});


app.get("/petition", function(request, response) {
    response.render("petition", {}); //this is the template that will be rendered. default is the folder named views.
});

app.get("/login", function(request, response) {
    response.render("login", {}); //this is the template that will be rendered. default is the folder named views.
});

app.get("/registration", function(request, response) {
    response.render("registration", {}); //this is the template that will be rendered. default is the folder named views.
});

app.get("/logout", function(request, response) {
    response.render("logout", {}); //this is the template that will be rendered. default is the folder named views.
});

app.get("/tellusmore", function(request, response) {
    response.render("tellusmore", {}); //this is the template that will be rendered. default is the folder named views.
});

app.get("/deleteprofile", (request, response) => {
    db.deleteProfile();
    request.session = null
        .then(() => {
            console.log("Profile has been deleted!");
            response.cookie("logout", "yes");
            response.redirect("/logout");
        })
        .catch(err => {
            console.log("delete profile error:", err);
        });
});

app.get("/thank-you", function(request, response) {
    const userId = request.session.userId;
    console.log("userid: ", userId);
    db.getSignatureUrl(userId)
        .then(results => {
            console.log("results.rows: ", results.rows);
            const userSignature = results.rows[0].signature;
            console.log(
                "userSignature in thank-you page: ",
                userSignature
            );
            response.render("thank-you", {
                userId: results.rows[0].userId,
                signature: results.rows[0].signature,
                first: results.rows[0].first_name,
                last: results.rows[0].last_name
            });
        })
        .catch(error => {
            console.log("error in thank-you page:", error.message);
        });
});

app.get("/updateprofile", function(request, response) {
    //const userId = request.session.userId;
    db.getProfileData(request.session.userId)
        .then(results => {
            console.log("getProfileData results: ", results.rows[0]);
            response.render('updateprofile', {
                allData: results.rows[0]
            });
        }).catch(error => {
            console.log("error in update profile page:", error.message);
        });
});

app.get('/signers', (request, response) => {
    db.getSigs()
        .then(results => {
            console.log("results: ", results);
            const signerNames = results.rows;
            console.log("signer names: ", signerNames);
            response.render('signers', {
                allSigners: signerNames
            });
        })
        .catch(error => {
            console.log("error getting signers data:", error.message);
        });
});

app.post("/petition", (request, response) => {
    console.log('request.body.signature: ', request.body.signature);
    db.addSign(request.body.signature, request.session.userId)
        .then(() => {
            console.log("New signature added!");
            response.redirect("/thank-you");
        })
        .catch(err => {
            console.log("petition error:", err);
        });
});

app.post("/registration", (request, response) => {
    const firstName = request.body.first_name;
    const lastName = request.body.last_name;
    const emailAddress = request.body.email;
    bc.hashPassword(request.body.password).then(passwordHash => {
        return db.addUser(firstName, lastName, emailAddress, passwordHash).then(results => {
            console.log("New person registered!");
            const userId = results.rows[0].id;
            request.session.userId = userId;
            const userFirstName = results.rows[0].first_name;
            request.session.userFirstName = userFirstName;
            const userLastName = results.rows[0].last_name;
            request.session.userLastName = userLastName;
            request.session.account = true;
            console.log("request.session :", request.session);
            response.redirect("/tellusmore");
        });
    })
        .catch(err => {
            console.log("registration error:", err);
        });
});

app.post("/updateprofile", notLoggedIn, (req, res) => {
    db.updateUsers(req.session.userId, req.body.first_name, req.body.last_name, req.body.email).then(() => {

        db.updateUserProfiles(req.session.userId, req.body.age, req.body.city, req.body.homepage).then(() => {
            res.redirect("/thank-you");
        }).catch(err => {
            console.log("error:", err);
        });
    });
});


app.post("/tellusmore", (request, response) => {
    db.addTellUsMore(request.body.age, request.body.city, request.body.homepage, request.session.userId)
        .then(() => {
            console.log("Tell us more info added!");
            response.cookie("tellusmore", "yes");
            response.redirect("/petition");
        })
        .catch(err => {
            console.log("error at tellusmore:", err);
        });
});

app.post("/login", loggedIn, (req, res) => {
    db.getPasswordCheckIfSigned(req.body.email).then(infos => {
        // console.log("infos.rows[0].signature", infos.rows[0].signature);
        req.session.newUserId = infos.rows[0].id;
        if (infos.rows[0].signature == null) {
            console.log("HAS NOT SIGNED YET");
            res.redirect("/petition");
        } else {
            req.session.signatureId = true;
            res.redirect("/thank-you");
        }
        return bc.checkPassword(req.body.password, infos.rows[0].password)
            .then(result => {
                if (!result) {
                    res.render("log-in", {
                        invalid: true
                    }); //closes render
                } //closes else
            });  //closes then
    }) //closes  getPassword
        .catch(err => {
            console.log("error:", err);
            res.render("log-in", {
                noEmail: true
            }); //closes render
        }); //closes catch
}); //closes post

app.post("/logout", (request, response) => {
    request.session = null
        .then(() => {
            console.log("User logged out!");
            request.session.signed = false;
            response.redirect("/logout");
        })
        .catch(err => {
            console.log("logout error:", err);
        });
});

app.post("/deletesignature", (request, response) => {
    db.deleteSignature()
        .then(() => {
            console.log("Signature deleted!");
            request.session.signed = false;
            response.redirect("/petition");
        })
        .catch(err => {
            console.log("signature deletion error:", err);
        });
});

app.listen(process.env.PORT || 8080, () => console.log('Listening!'));
