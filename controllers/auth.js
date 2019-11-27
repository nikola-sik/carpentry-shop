const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const User = require('../models/user');
const date = require('../util/date');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const error = require('../util/error');

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: `${process.env.SEND_GRID_KEY}`
    }
}));

exports.getLogin = (req, res, next) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    let infoMessage = req.flash('info');
    if (infoMessage.length > 0) {
        infoMessage = infoMessage[0];
    } else {
        infoMessage = null;
    }

    res.render('auth/login', {
        pageTitle: 'Prijava',
        path: '/login',
        errorMessage: message,
        infoMessage: infoMessage,
        oldInput: {
            username: '',
            password: ''
        },
        validationErrors: []
    });
};

exports.getRegistration = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/registration', {
        pageTitle: 'Registracija',
        path: '/registration',
        errorMessage: message,

        oldInput: {
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            name: '',
            surname: '',
            phoneNumber: ''
        },
        validationErrors: []

    });
};

exports.postLogin = (req, res, next) => {

    const username = req.body.username;
    const password = req.body.password;
    let user = new User();

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(422).render('auth/login', {
            pageTitle: 'Prijava',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            infoMessage: null,
            oldInput: {
                username: username,
                password: password,
            },
            validationErrors: errors.array()
        });

    }




    User.findByUsername(username)
        .then(([rows]) => {
            user = rows[0];

            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Prijava',
                    path: '/login',
                    errorMessage: 'Korisničko ime ili lozinka nisu validni!',
                    infoMessage: null,
                    oldInput: {
                        username: username,
                        password: password,
                    },
                    validationErrors: []
                });
            }

            return bcryptjs.compare(password, user.password)
                .then(result => {
                    if (result) {

                        if (user.admin === 1) {
                            req.session.isAdmin = true;
                        } else req.session.isAdmin = false;
                        req.session.user = user;//postavljanje korisnika u sesiju
                        req.session.isLoggedIn = true;
                        return req.session.save(err => {

                            res.redirect('/');
                        });
                    } return res.status(422).render('auth/login', {
                        pageTitle: 'Prijava',
                        path: '/login',
                        errorMessage: 'Korisničko ime ili lozinka nisu validni!',
                        infoMessage: null,
                        oldInput: {
                            username: username,
                            password: password,
                        },
                        validationErrors: []
                    });
                })
                .catch(err => error.get500Error(err, next));


        })
        .catch(err => error.get500Error(err, next));




};

exports.postRegistration = (req, res, next) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    let name = req.body.name;
    let surname = req.body.surname;
    let phoneNumber = req.body.phoneNumber;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(422).render('auth/registration', {
            pageTitle: 'Registracija',
            path: '/registration',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                username: username,
                password: password,
                confirmPassword: confirmPassword,
                email: email,
                name: name,
                surname: surname,
                phoneNumber: phoneNumber
            },
            validationErrors: errors.array()
        });

    }

    if (!name) name = null;
    if (!surname) surname = null;
    if (!phoneNumber) phoneNumber = null;

    let user = new User();

    return bcryptjs.hash(password, 12)
        .then((hash) => {
            user = new User(null, name, surname, username, hash, email, phoneNumber);
            
            crypto.randomBytes(32, (err, buffer) => {
                if (err) return res.redirect('/')
                const token = buffer.toString('hex');
                user.token = token;
                user.tokenExpirationTime = Date.now() + 1800000;//token traje 30min
             
                return user.save()
                    .then(() => {
                        return transporter.sendMail({
                            to: email,
                            from: `${process.env.SHOP_EMAIL}`,
                            subject: 'Aktivacija naloga',
                            html: `<h1>Korisničko ime: ${username}</h1>
                                 <h2>Link za aktivaciju naloga: <a href="${process.env.URL_AND_PORT}/activation/${token}" style="color: blue">Klikni za aktivaciju naloga.</a></h2>
                                 <h4>Link za aktivaciju naloga važi 30 minuta.</h4>
                                 `

                        }).then(() => {
                            req.flash('info', 'Link za aktivaciju naloga je poslat na e-mail adresu: ' + email+ ' i važi 30 minuta.');
                            res.redirect('/login');
                        });

                    });
            });



        })
        .catch(err => error.get500Error(err, next));

};

exports.postLogout = (req, res, next) => {

    req.session.destroy(err => {
        if (err) { error.get500Error(err, next); }
        res.redirect('/login');
    })

};

exports.getActivationAccount = (req, res, next) => {


    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else if (req.flash('info').length > 0) {
        message = req.flash('info')[0];
    }
    else {
        message = null;
    }

    const token = req.params.token;
    let msg = 'error';
    let user = new User();
    User.findByToken(token)
        .then(([rows]) => {
            user = rows[0];

            if (user) {

                if (user.tokenExpirationTime > Date.now()) {
                    user.active = 1;
                    return User.updateActive(user.id, user.active)
                        .then(() => {
                            msg = 'successful';
                            res.render('auth/activation', {
                                pageTitle: 'Aktivacija naloga',
                                path: '/activation/' + token,
                                msg: 'successful',
                                korisnikId: user.id
                            });
                        })
                        .catch(err => error.get500Error(err, next));

                } else {

                    msg = 'token istekao';

                    res.render('auth/activation', {
                        pageTitle: 'Aktivacija naloga',
                        path: '/activation/' + token,
                        msg: 'token expired',
                        korisnikId: user.id
                    });
                }

            }
            else {
                res.redirect('/');
            }


        }).catch(err => error.get500Error(err, next));




};

