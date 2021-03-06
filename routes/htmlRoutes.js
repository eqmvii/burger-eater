var db = require("../models");
var passport = require('passport');

module.exports = function (app) {

    app.get("/", (req, res) => {
        Promise.all([db.User.findAll({ where: { admin: false } }), db.Band.findAll({})])
            .then(function (results) {
                res.render("index", {
                    user: req.user, users: results[0], bands: results[1], helpers: {
                        randomStars: randomStars,
                        getFormattedTimeString: getFormattedTimeString
                    }
                });
            });
    });

    // Create Account Route
    app.post("/api/users", (req, res) => {
        db.User.findOrCreate({
            where: {
                username: req.body.username
            }, defaults: {
                username: req.body.username,
                password: req.body.password
            }
        }).spread((newUser, created) => {
            if (created) {
                console.log("New user!");
                console.log(newUser);
                // res.redirect("/");
                req.login(newUser, function (err) { // from passport, allows login ad hoc
                    if (err) { return next(err); }
                    return res.redirect('/profile');
                });
            } else {
                console.log("User already exists");
                return res.redirect('/error');
            }

        });
    });

    app.get("/login", (req, res) => {
        res.render("login");
    });

    app.get("/register", (req, res) => {
        res.render("register");
    });

    app.post('/login',
        passport.authenticate('local', { failureRedirect: '/error' }),
        function (req, res) {
            res.redirect('/profile');
        });

    app.get('/logout',
        function (req, res) {
            req.logout();
            res.redirect('/');
        });

    app.get('/profile',
        require('connect-ensure-login').ensureLoggedIn('/login'),
        function (req, res) {
            // console.log(" % % % % % % ");
            // console.log(req.user);
            // console.log(" % % % % % % ");
            // var myBands = req.user.getBands(
            // TODO: Atone for this.
            console.log(`User ID: ${req.user.id}`);
            var myBands = db.User.findAll({
                where: { id: parseInt(req.user.id, 10) },
                include: [{
                    model: db.Band,
                    as: "Bands",
                    through: {
                        attributes: ["rating"]
                    }
                }]
            });
            var allBands = db.Band.findAll({});
            Promise.all([myBands, allBands])
                .then(function (results) {
                    console.log("% % % % % % % % % %");
                    console.log(results[0][0].get({ plain: true }));
                    // console.log(results[0][0].Bands[0].BandUser.get({plain: true}));
                    res.render("profile", { user: req.user, myBands: results[0][0].Bands, allBands: results[1] });
                });
        });

    app.get('/upload',
        require('connect-ensure-login').ensureLoggedIn('/login'),
        function (req, res) {
            res.render("upload", { user: req.user, cssLink: "css/upload.css" });
        });

    app.get("/error", (req, res) => {
        res.render("error", { user: req.user });
    });


    //
    // BANDS
    //

    app.get("/bands", (req, res) => {
        db.Band.findAll({}).then(function (results) {
            res.render("bands/all", { user: req.user, bands: results });
        });
    });

    app.get("/band/:id", (req, res) => {
        console.log(`Get band ${req.params.id}`);
        db.Band.findOne({
            where: { id: req.params.id }
        }).then(function (results) {
            res.render("bands/band", { band: results });
        });
    });


    //
    // HANDLEBARS HELPER FUNCTIONS
    //

    function randomStars() {
        console.log("helper got called");
        return "" + Math.floor((Math.random() * 10) + 1);
    }

    function minuteFormat(time) {
        if (time == "0") {
            return "00";
        } else {
            return time;
        }
    }

    function getFormattedTimeString(time) {
        console.log(time);
        var master_time = new Date(time);
        var date = master_time.toDateString();
        date = date.substring(0, date.length - 4);
        time = master_time.getHours() + ":" + minuteFormat(master_time.getMinutes());
        return "Time: " + date + time;
    }

};
