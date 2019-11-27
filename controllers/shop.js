const Product = require('../models/product');
const error = require('../util/error');
const { validationResult } = require('express-validator');
const  ITEMS_BY_PAGE = process.env.ITEMS_BY_PAGE;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let offset = (page - 1) * ITEMS_BY_PAGE;
    let totalProducts=0;
    const search = req.query.search;
   

    const errors = validationResult(req);
    if (errors.isEmpty() && !search) {
       return Product.count()
        .then(([rows]) => {
            if (rows.length === 0) { return next('Nema proizvoda'); }
            totalProducts = rows[0].totalProducts;

            return Product.fetchByPage(ITEMS_BY_PAGE, offset)
                .then(([rows, fieldData]) => {
                      res.render('shop/products', {
                        pageTitle: 'Proizvodi',
                        products: rows,
                        path: '/products',
                        currentPage: page,
                        hasNext: ITEMS_BY_PAGE * page < totalProducts,
                        hasPreviousPage: page > 1,
                        nextPage: page + 1,
                        previousPage: page - 1,
                        lastPage: Math.ceil(totalProducts / ITEMS_BY_PAGE),
                        infoMessage: null
                    });
                });
        })
        .catch(err => error.get500Error(err, next));
    }

    if(!errors.isEmpty() || !search){
       return res.render('shop/products', {
            pageTitle: 'Proizvodi',
            products: [],
            path: '/products',
            currentPage: page,
            hasNext: ITEMS_BY_PAGE * page < totalProducts,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalProducts / ITEMS_BY_PAGE),
            infoMessage: errors.array()[0].msg 
        });
    }

    Product.countSearch(search)
        .then(([rows]) => {
            
            if (rows.length === 0) { return next('Nema proizvoda'); }
            totalProducts = rows[0].totalProducts;
            
            return Product.fetchByPageSearch(ITEMS_BY_PAGE, offset,search)
                .then(([rows, fieldData]) => {
                    res.render('shop/products', {
                        pageTitle: 'Proizvodi',
                        products: rows,
                        path: '/products',
                        currentPage: page,
                        hasNext: ITEMS_BY_PAGE * page < totalProducts,
                        hasPreviousPage: page > 1,
                        nextPage: page + 1,
                        previousPage: page - 1,
                        lastPage: Math.ceil(totalProducts / ITEMS_BY_PAGE),
                        infoMessage: null 
                    });
                });
        })
        .catch(err => error.get500Error(err, next));

    


}


exports.getProductDetails = (req, res, next) => {
    const productId = req.params.productId;


    Product.findById(productId)
        .then(([products]) => {
            if (products.length > 0) {
                res.render('shop/product-details', { pageTitle: products[0].title, product: products[0], path: '/products' });
            }
            else {
                res.status(404).render("404", { pageTitle: "Greska", path: "404" });
            }
        })
        .catch(err => error.get500Error(err, next));



}

exports.getIndex = (req, res, next) => {

    Product.fetchAll()
        .then(([rows, fieldData]) => {
            res.render('shop/index', {
                pageTitle: 'Početna',
                products: rows,
                path: '/'
            });
        })
        .catch(err => error.get500Error(err, next));


}


