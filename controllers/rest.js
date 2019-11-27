const Product = require('../models/product');
const error = require('../util/error');
const { validationResult } = require('express-validator');


exports.getProducts = (req, res, next) => {

    const products = [];
    const errors = validationResult(req);

    Product.fetchAll()
        .then(([rows]) => {
            rows.forEach(p => {
                products.push(Product.create(p));
            });
            res.status(200).json({ products });
        })
        .catch(err => res.status(500).json({ error:'error' }));

}