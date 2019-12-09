const Product = require('../models/product');
const error = require('../util/error');

exports.getProducts = (req, res, next) => {

    Product.fetchForREST()
    .then(([products]) => {
        res.status(200).json({ products });
    })
    .catch(err => res.status(500).json({ error:'error' }));

}