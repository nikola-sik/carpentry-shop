const express = require('express');
const { check } = require('express-validator');
const shopController = require('../controllers/shop');

const router = express.Router();

router.get("/", shopController.getIndex);

router.get("/products", [
    check('search', 'Unesite do 40 slova ili brojeva bez praznih mjesta.').isLength({ max: 40 }).isWhitelisted('asdfghjklzxcvbnmqwertyuiopšđčćžASDFGHJKLZXCVBNMQWERTYUIOPŠĐČĆŽ0123456789').whitelist('asdfghjklzxcvbnmqwertyuiopšđčćžASDFGHJKLZXCVBNMQWERTYUIOPŠĐČĆŽ0123456789').trim()
] ,shopController.getProducts );

router.get("/product-details/:productId",shopController.getProductDetails );

// ispod ovoga ne smije doci ruta /products/**** jer nikada nece njoj pristupiti

module.exports = router;