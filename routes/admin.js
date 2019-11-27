const express = require('express');
const { check } = require('express-validator');
const bcryptjs = require('bcryptjs');

const adminController = require('../controllers/admin');
const isAdmin = require('../middleware/isAdmin');
const date = require('../util/date')
const router = express.Router();

router.post('/add-product', [
    check('title', 'Navalidan unos za naziv. Minimalno 3 alfanumerička znaka.').isString().isLength({ min: 3, max: 43 }).trim(),
    check('shortDescription', 'Navalidan unos za kratak opis.').isLength({ min: 5, max: 448 }).trim(),
    check('description', 'Navalidan unos za detaljni opis.').isLength({ min: 5, max: 3998 }).trim(),
    check('price', 'Navalidan unos cijene.').isFloat({ min: 0, max: 999999 })
], isAdmin, adminController.postAddProduct);

router.get('/add-product', isAdmin, adminController.getAddProduct);

router.get('/orders', isAdmin, adminController.getOrders);

router.get('/messages', isAdmin, adminController.getMessages);

router.get('/users', isAdmin, adminController.getUsers);

router.get('/products', [
    check('search', 'Unesite do 40 slova ili brojeva bez praznih mjesta.').isLength({ max: 40 }).isWhitelisted('asdfghjklzxcvbnmqwertyuiopšđčćžASDFGHJKLZXCVBNMQWERTYUIOPŠĐČĆŽ0123456789').whitelist('asdfghjklzxcvbnmqwertyuiopšđčćžASDFGHJKLZXCVBNMQWERTYUIOPŠĐČĆŽ0123456789').trim()
], isAdmin, adminController.getProducts);

router.post('/edit-product', [
    check('title', 'Za naziv unesite minimalno 3 znaka.').isString().isLength({ min: 3, max: 43 }).trim(),
    check('shortDescription', 'Navalidan unos za kratak opis.').isLength({ min: 5, max: 448 }).trim(),
    check('description', 'Navalidan unos za opis.').isLength({ min: 5, max: 3998 }).trim(),
    check('price', 'Navalidan unos cijene.').isFloat({ min: 0, max: 999999 })

], isAdmin, adminController.postEditProduct);

router.get('/edit-product/:productId', isAdmin, adminController.getEditProduct);

router.post('/delete-product', isAdmin, adminController.postDeleteProduct);

router.post("/delete-order", isAdmin, adminController.postDeleteOrder);

router.get("/order-details/:orderId", isAdmin, adminController.getOrderDetails);

router.get("/order-item-details/:orderItemId", isAdmin, adminController.getOrderItemDetails);

router.post("/change-order-status", isAdmin, adminController.postChangeOrderStatus);
//request ide sa lijeva udesno kroz middleware

router.get("/invoice/:orderId", isAdmin, adminController.getInvoice);

router.post("/new-message", [
    check('text', 'Poruka je prazna ili predugačka.').isLength({ min: 1, max: 448 }).trim()

], isAdmin, adminController.postNewMessage);
router.post("/delete-message", isAdmin, adminController.postDeleteMessage);

router.post("/update-to-readed", isAdmin, adminController.postUpdateToReaded);

router.get('/user-messages/:sender', isAdmin, adminController.getUserMessages);

router.post("/delete-user", isAdmin, adminController.postDeleteUser);

router.post("/change-user-status", isAdmin, adminController.postChangeUserStatus);

router.post("/delete-all-user-messages", isAdmin, adminController.postDeleteAllMessagesOfUser);

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
    , isAdmin, adminController.postChangePassword);

router.post("/edit-user-data", [

    check('name', 'Ime treba da sadrži samo slova do 40 karaktera.').if(check('name').not().isEmpty()).isAlpha(['sr-RS@latin']).isLength({ min: 2, max: 40 }),
    check('surname', 'Prezime treba da sadrži samo slova do 40 karaktera.').if(check('surname').not().isEmpty()).isAlpha(['sr-RS@latin']).isLength({ min: 2, max: 40 }),
    check('phoneNumber', 'Broj telefona treba da sadrži samo brojeve do 20 cifara.').if(check('phoneNumber').not().isEmpty()).isLength({ min: 6, max: 20 }).isNumeric()

]
    , isAdmin, adminController.postEditUserData);

router.get("/my-account", isAdmin, adminController.getMyAccount);

router.get("/procurements", isAdmin, adminController.getProcurements);

router.post("/new-procurement", [
    check('title', 'Za naziv unesite minimalno 3 znaka.').isString().isLength({ min: 3, max: 43 }).trim(),
    check('description', 'Navalidan unos za opis, potrebno je unijeti 3 do 4000 karaktera.').isLength({ min: 3, max: 4000 }).trim(),
    check('price', 'Navalidan unos cijene.').isFloat({ min: 0, max: 999999 }),
    check('supplier', 'Za dobavljaca unesite minimalno 3 znaka.').isString().isLength({ min: 3, max: 43 }).trim(),
    check('date', 'Nevalidan unos za datum.').isAfter(date.dateLastYear())
], isAdmin, adminController.postProcurement);

router.get("/procurement-details/:procurementId", isAdmin, adminController.getProcurementDetails);

router.post("/new-procurement-item", [
    check('title', 'Za naziv unesite minimalno 3 znaka.').isString().isLength({ min: 3, max: 43 }).trim(),
    check('description', 'Navalidan unos za opis, potrebno je unijeti 3 do 200 karaktera.').isLength({ min: 3, max: 200 }).trim(),
    check('quantity', 'Navalidan unos kolicine.').isInt({ min: 1, max: 999999 })

], isAdmin, adminController.postProcurementItem);

router.get("/new-procurement-item", isAdmin, adminController.getNewProcurementItem);

router.get("/new-procurement", isAdmin, adminController.getNewProcurement);

router.post("/delete-procurement", isAdmin, adminController.postDeleteProcurement);

router.post("/delete-procurement-item", isAdmin, adminController.postDeleteProcurementItem);

module.exports = router;
