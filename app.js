const express = require('express');
const path = require('path');
const conf = require('conf');
const handlebars = require('express-handlebars');
const uuid = require('uuid')

const app = express();
const data = new conf();

const handlebars_inst = handlebars.create({
    extname: '.handlebars',
    compilerOptions: {
        preventIndent: true
    },
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
});
app.engine('handlebars', handlebars_inst.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views', 'pages'));

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

/**
 * Get the user from the username
 * @param {conf} data Stored user account information
 * @param {String} username 
 * @returns {Object} The user
 */
function getUser(data, username) {
    for(const entry of data) {
        const user = entry[1];
        if(username === user.username) {
            return user;
        }
    }
}

/**
 * Check if the given username is already taken
 * @param {conf} data Stored user account information
 * @param {String} username 
 * @returns {Boolean} True if username is taken. False otherwise.
 */
function userIsTaken(data, username) {
    for(const entry of data) {
        const user = entry[1];
        if(username === user.username) {
            return true;
        }
    }
    return false;
}

/**
 * Check if the given email is already taken
 * @param {conf} data Stored user account information
 * @param {String} email 
 * @returns {Boolean} True if email is taken. False otherwise.
 */
function emailIsTaken(data, email) {
    for(const entry of data) {
        const user = entry[1];
        if(email === user.email) {
            return true;
        }
    }
    return false;
}

//Login page
app.route('/user/login')
    .get((req, res) => {
        res.render('login')
    })
    .post((req, res) => {
        const user = getUser(data, req.body.username);

        //User isn't found or invalid password
        if(user === undefined || user.pwd != req.body.pwd) {
            res.status(401).render('login', {
                alert: {
                    level: 'warning',
                    title: 'Invalid username/password',
                    message: 'Enter your information again'
                }
            })
        }

        //Login success
        else {
            res.redirect('/user/' + user.id)
        }
    });

//Register new user
app.route('/user/new')
    .get((req, res) => {
        res.render('new')
    })
    .post((req, res) => {

        //Passwords don't match
        if(req.body.pwd !== req.body.vfypwd) {
            res.render('new', {
                alert: {
                    level: 'warning',
                    title: 'Passwords do not match',
                    message: 'Enter your information again'
                }
            })
        }

        //Username already in use
        else if(userIsTaken(data, req.body.username)) {
            res.render('new', {
                alert: {
                    level: 'warning',
                    title: 'Username already taken',
                    message: 'Enter your information again'
                }
            })
        }

        //Email already in use
        else if(emailIsTaken(data, req.body.email)) {
            res.render('new', {
                alert: {
                    level: 'warning',
                    title: 'Email already taken',
                    message: 'Enter your information again'
                }
            })
        }

        //Account creation successful
        else {
            const newID = uuid.v1();
            data.set(newID, {
                id: newID,
                username: req.body.username,
                email: req.body.email,
                pwd: req.body.pwd,
                vfypwd: req.body.vfypwd,
                phone: req.body.phone
            });
            res.redirect('/user/login')
        }
    });

//User account
app.route('/user/:user_id')
    .get((req, res) => {

        //Display user's account
        if(data.has(req.params.user_id)) {
            res.render('user', {
                user: data.get(req.params.user_id)
            })
        }

        //User not found
        else {
            res.status(404).render('404', {
                alert: {
                    level: 'warning',
                    title: '404',
                    message: 'Page not found'
                }
            })
        }
    })
    .post((req, res) => {

        //Valid user
        if(data.has(req.params.user_id)) {

            //New password doesn't match
            if(req.body.pwd !== req.body.vfypwd) {
                res.render('user', {
                    user: data.get(req.params.user_id),
                    alert: {
                        level: 'warning',
                        title: 'Passwords do not match',
                        message: 'Enter your information again'
                    }
                })
            }

            //Update successful
            else {
                data.set(req.params.user_id, {
                    username: req.body.username,
                    email: req.body.email,
                    pwd: req.body.pwd,
                    vfypwd: req.body.vfypwd,
                    phone: req.body.phone
                });
                res.render('user', {
                    user: data.get(req.params.user_id),
                    alert: {
                        level: 'success',
                        title: 'Success!',
                        message: 'Information successfully updated'
                    }
                })
            }
            
        }

        //User not found
        else {
            res.status(404).render('404', {
                alert: {
                    level: 'warning',
                    title: '404',
                    message: 'Page not found'
                }
            })
        }
    })

//Run server
app.listen(3000, () => {
    console.log('express app running at http://localhost:3000/')
});