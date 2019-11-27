const express = require('express');
const { check } = require('express-validator');
const restController = require('../controllers/rest');

const router = express.Router();

router.get("/products", restController.getProducts );

module.exports = router;