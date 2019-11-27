const express = require('express');
const authController = require('../controllers/auth');
const User = require('../models/user');
const isLoggedIn = require('../middleware/isLoggedIn');
const { check } = require('express-validator');
const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', [
  check('username', 'Korisničko ime ili lozinka nisu validni!')
    .isLength({ min: 4 }).trim(),
  check('password', 'Korisničko ime ili lozinka nisu validni!')
    .isLength({ min: 8 })
    .trim(),
], authController.postLogin);

router.get('/registration', authController.getRegistration);

router.post('/registration', [
  check('username')
    .isLength({ min: 4, max: 43 })
    .withMessage('Korisničko ime treba da ima minimalno 4 karaktera.')
    .custom((value, { req }) => {
      return User.findByUsernameAll(value)
        .then(([users]) => {       //then implicitno vraca promis
          if (users[0]) {
            return Promise.reject('Korisničko ime je zauzeto, unesite drugo.');
          }
        })

    }),//express vlaidator provjerava da li custom validator vraca true ili false, da li ima throw error, da li vraca promis i da li je promis uspjesno zavrsen ili ako nije prikazace gresku
  check('email')
    .isEmail()
    .withMessage('Unesite validnu e-mail adresu.')
    .custom((value, { req }) => {
      return User.findByEmail(value)
        .then(([users]) => {
          if (users[0]) {
            return Promise.reject('E-Mail je zauzet, unesite drugi.');
          }
        })

    })
    .normalizeEmail(),
  check('password', 'Unesite lozinku sa minimalno 8 karaktera.')
    .isLength({ min: 8 })
    .trim(),
  check('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Lozinke se trebaju poklapati!');
      }
      return true;
    })
    .trim(),
  check('name', 'Ime treba da sadrži samo slova do 40 karaktera.').if(check('name').not().isEmpty()).isAlpha(['sr-RS@latin']).isLength({ min: 2, max: 40 }),
  check('surname', 'Prezime treba da sadrži samo slova do 40 karaktera.').if(check('surname').not().isEmpty()).isAlpha(['sr-RS@latin']).isLength({ min: 2, max: 40 }),
  check('phoneNumber', 'Broj telefona treba da sadrži samo brojeve do 20 cifara.').if(check('phoneNumber').not().isEmpty()).isLength({ min: 6, max: 20 }).isNumeric()

],
  authController.postRegistration);

router.post('/logout', authController.postLogout);

router.get('/activation/:token', authController.getActivationAccount);


module.exports = router;