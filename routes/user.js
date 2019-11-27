
const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/user');
const isLoggedIn = require('../middleware/isLoggedIn');
const date = require('../util/date');
const bcryptjs = require('bcryptjs');
const router = express.Router();

router.get("/orders", isLoggedIn, userController.getOrders);

router.get("/messages", isLoggedIn, userController.getMessages);

router.post("/save-order", [
    check('title', 'Za naziv unesite minimalno 3 znaka.').isString().isLength({ min: 3, max: 43 }).trim(),
    check('description', 'Navalidan unos za opis.').isLength({ min: 5, max: 3998 }).trim(),
    check('dateOfDelivery', 'Rok isporuke treba biti najmanje 2 dana unaprijed.').isAfter(date.minDate())
], isLoggedIn, userController.postSaveOrder);

router.get("/new-order", isLoggedIn, userController.getNewOrder);

router.post("/delete-order", isLoggedIn, userController.postDeleteOrder);

router.post("/new-order-item", [
    check('title', 'Za naziv unesite 3-43 znaka.').isString().isLength({ min: 3, max: 43 }).trim(),
    check('description', 'Navalidan unos za opis.').isLength({ min: 3, max: 3999 }).trim(),
    check('imageUrl', 'Navalidan unos slike.').if(check('slikaUrl').not().isEmpty()).isLength({ min: 3, max: 254 }).isURL().trim(),
    check('price', 'Navalidan unos cijene.').isFloat({ min: 0, max: 99999999.99 }),
    check('quantity', 'Navalidan unos kolicine.').isInt({ min: 0, max: 999999 })
], isLoggedIn, userController.postNewOrderItem);

router.post("/add-product-to-order", isLoggedIn, userController.postAddProductToOrder);

router.get("/new-order-item", isLoggedIn, userController.getNewOrderItem);

router.post("/delete-order-item", isLoggedIn, userController.postDeleteOrderItem);

router.get("/order-item-details/:orderItemId", isLoggedIn, userController.getOrderItemDetails);

router.get("/order-details/:orderId", isLoggedIn, userController.getOrderDetails);

router.post("/increase-quantity/", isLoggedIn, userController.postIncreaseQuantity);

router.post("/decrease-quantity/", isLoggedIn, userController.postDecreaseQuantity);

router.post("/new-message", [
    check('text', 'Poruka je prazna ili predugačka.').isLength({ min: 1, max: 448 }).trim()

], isLoggedIn, userController.postNewMessage);

router.post("/delete-message", isLoggedIn, userController.postDeleteMessage);

router.post("/update-to-readed", isLoggedIn, userController.postUpdateToReaded);

router.post("/change-password", [
    check('oldPassword', 'Unesite validnu staru lozinku!')
        .isLength({ min: 8 })
        .custom((value, { req }) => {

            return bcryptjs.compare(value, req.session.user.password)
                .then(result => {
                    if (!result) {
                        throw new Error('Unesite validnu staru lozinku!');
                    }
                    return true;
                })

        })
        .trim(),
    check('newPassword', 'Unesite lozinku sa minimalno 8 karaktera.')
        .isLength({ min: 8 })
        .trim(),
    check('confirmationNewPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Lozinke se moraju poklapati!');
            }
            return true;
        })
        .trim(),

]
    , isLoggedIn, userController.postChangePassword);

router.post("/edit-user-data", [

    check('name', 'Ime treba da sadrži samo slova do 40 karaktera.').if(check('name').not().isEmpty()).isAlpha(['sr-RS@latin']).isLength({ min: 2, max: 40 }),
    check('surname', 'Prezime treba da sadrži samo slova do 40 karaktera.').if(check('surname').not().isEmpty()).isAlpha(['sr-RS@latin']).isLength({ min: 2, max: 40 }),
    check('phoneNumber', 'Broj telefona treba da sadrži samo brojeve do 20 cifara.').if(check('phoneNumber').not().isEmpty()).isLength({ min: 6, max: 20 }).isNumeric()

]
    , isLoggedIn, userController.postEditUserData);


router.get("/my-account", isLoggedIn, userController.getMyAccount);

module.exports = router;