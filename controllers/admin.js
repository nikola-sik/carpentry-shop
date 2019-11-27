const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const bcryptjs = require('bcryptjs');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const Procurement = require('../models/procurement');
const ProcurementItem = require('../models/procurement-item');
const Message = require('../models/message');
const { validationResult } = require('express-validator');
const date = require('../util/date');
const error = require('../util/error');
const pdfInvoice = require('../util/pdfInvoice');
const fileHelper = require('../util/file');
const OrderItem = require('../models/order-item');
const ITEMS_BY_PAGE = process.env.ITEMS_BY_PAGE;

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: `${process.env.SEND_GRID_KEY}`
    }
}));

exports.getAddProduct = (req, res, next) => {

    return res.render('admin/add-product',
        {
            pageTitle: 'Dodaj proizvod',
            path: '/admin/add-product',
            errorMessage: null,
            product: {
                title: '',
                shortDescription: '',
                description: '',
                imageUrl: '',
                price: ''
            },
            validationErrors: []
        });

};

exports.postAddProduct = async (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const description = req.body.description;
    const price = req.body.price;
    const shortDescription = req.body.shortDescription;
    const product = new Product(null, title, null, shortDescription, description, price);

    try {
        if (!image) {

            return res.status(422).render('admin/add-product',
                {
                    pageTitle: 'Dodaj proizvod',
                    path: '/admin/add-product',
                    errorMessage: 'Dozvoljeni formati slike su png, jpg i jpeg veličine do 10MB.',
                    product: product,
                    validationErrors: []
                });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('admin/add-product',
                {
                    pageTitle: 'Dodaj proizvod',
                    path: '/admin/add-product',
                    errorMessage: errors.array()[0].msg,
                    product: product,
                    validationErrors: errors.array()
                });

        }

        product.imageUrl = '/images/' + image.filename;
        await product.save();
        res.redirect('/admin/products');
        //kada u promisu imamo u then bloku retrun object, object postaje promis
    }
    catch (err) {
        error.get500Error(err, next);     //asyinc kodu kao sto su then, catch, callback, da bi dosli do error middlewara moramo koristiti next(err) ne moze samo throw new Error()
    }


};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let offset = (page - 1) * ITEMS_BY_PAGE;
    let totalProducts = 0;
    const search = req.query.search;


    const errors = validationResult(req);
    if (errors.isEmpty() && !search) {
        return Product.count()
            .then(([rows]) => {
                if (rows.length === 0) { return next('Nema proizvoda'); }
                totalProducts = rows[0].totalProducts;

                return Product.fetchByPage(ITEMS_BY_PAGE, offset)
                    .then(([rows, fieldData]) => {
                        res.render('admin/products', {
                            pageTitle: 'Proizvodi',
                            products: rows,
                            path: '/admin/products',
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

    if (!search) {
        return res.render('admin/products', {
            pageTitle: 'Proizvodi',
            products: [],
            path: '/admin/products',
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

            return Product.fetchByPageSearch(ITEMS_BY_PAGE, offset, search)
                .then(([rows, fieldData]) => {
                    res.render('admin/products', {
                        pageTitle: 'Proizvodi',
                        products: rows,
                        path: '/admin/products',
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




};

exports.getMessages = (req, res, next) => {

    const search = req.query.search;

    const admin = req.session.user.username;
    Message.findSendersAndAdmin(admin)
        .then(([messageUsers]) => {
            messageUsers = messageUsers.filter(k => k.username !== admin);
            if (search) { messageUsers = messageUsers.filter(k => k.username === search); }

            return Message.findUnreadedMessages(admin)
                .then(([messages]) => {
                    if (search) { messages = messages.filter(k => k.sender === search); }
                    for (let i = 0; i < messageUsers.length; i++) {
                        let user = messageUsers[i].username;

                        if (user !== admin) {
                            if (!messages.some(e => e.sender === user)) {
                                messages.push({ numberOfUnreaded: 0, sender: user });
                            }
                        }
                    }
                    return User.fetchAllActive()
                        .then(([users]) => {
                            res.render('admin/messages', { pageTitle: 'Poruke', messages: messages, users: users, path: '/admin/messages' });
                        });

                });


        })
        .catch(err => error.get500Error(err, next));
}

exports.getUserMessages = (req, res, next) => {
    const username = req.params.sender;
    const admin = req.session.user.username;

    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }


    let infoMessage = req.flash('info');
    if (infoMessage.length > 0) {
        infoMessage = infoMessage[0];
    } else {
        infoMessage = null;
    }

    Message.findMessagesOfUserAdmin(username)
        .then(([messages]) => {

            messages.forEach(m => { m.sendingTime = m.sendingTime.substring(0, m.sendingTime.lastIndexOf(':')) });

            res.render('admin/user-messages', {
                pageTitle: 'Poruke',
                messages: messages,
                username: username,
                errorMessage: errorMessage,
                infoMessage: infoMessage,
                path: '/admin/messages'
            });

        }).catch(err => error.get500Error(err, next));
}



exports.postNewMessage = (req, res, next) => {
    const text = req.body.text;
    const sender = req.session.user.username;
    let message;
    let username = req.body.recipient;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/admin/user-messages/' + username);


    }

    User.findByUsername(username)
        .then(([rows]) => {
            recipient = rows[0];

            if (!recipient) {

                return new Error('Nije pronađen primalac');
            }
            message = new Message(null, text, date.currentDateTime(), 0, recipient.username, sender);

            return message.save()
                .then(([result]) => {

                    req.flash('info', 'Poruka je poslata.');
                    res.redirect('/admin/user-messages/' + recipient.username);

                })

        })
        .catch(err => error.get500Error(err, next));

};

exports.postDeleteMessage = (req, res, next) => {

    const username = req.session.user.username;
    const messageId = req.body.messageId;

    Message.deleteById(messageId)
        .then(() => {
            res.status(200).json({ msg: "successful" });

        })

        .catch(err => error.get500Error(err, next));
};

exports.postDeleteAllMessagesOfUser = (req, res, next) => {

    const admin = req.session.user.username;
    const sender = req.body.username;

    Message.updateByIdAdminAll(admin, sender, admin, sender)
        .then(([result]) => {
            return Message.deleteByIdAdminAll(admin, sender, admin, sender)
                .then(() => {

                    res.status(200).json({ msg: "successful", changedRows: result.changedRows });

                })
        })
        .catch(err => error.get500Error(err, next));
};



exports.postUpdateToReaded = (req, res, next) => {
    const messageId = req.body.messageId;
    const message = new Message();
    message.id = messageId;

    message.updateToReaded()
        .then(() => {
            res.status(200).json({ msg: "successful" });

        })
        .catch(err => error.get500Error(err, next));

};





exports.getOrders = async (req, res, next) => {

    const page = +req.query.page || 1;
    let offset = (page - 1) * ITEMS_BY_PAGE;
    let totalOrders = 0;

    try {
        let [rows] = await Order.countAdmin();
        totalOrders = rows[0].totalOrders;
        const [orders] = await Order.fetchByPageAdmin(ITEMS_BY_PAGE, offset);


        res.render('admin/orders', {
            pageTitle: 'Vaše narudžbe',
            orders: orders,
            path: '/admin/orders',
            currentPage: page,
            hasNext: ITEMS_BY_PAGE * page < totalOrders,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalOrders / ITEMS_BY_PAGE),
            minDate: date.minDate()
        });

    }
    catch (err) {
        error.get500Error(err, next);
    }


}


exports.getUsers = async (req, res, next) => {

    let users;

    const search = req.query.search;
    const page = +req.query.page || 1;
    let offset = (page - 1) * ITEMS_BY_PAGE;
    let totalUsers = 0;

    try {
        if (search) {
            [users] = await User.findByUsernameWithoutAdmin(search);
            if (users.length === 1) { totalUsers = 1; }
        } else {
            let [rows] = await User.count();
            totalUsers = rows[0].totalUsers;
            [users] = await User.fetchByPage(ITEMS_BY_PAGE, offset);
        }

        res.render('admin/users', {
            pageTitle: 'Korisnici',
            users: users,
            path: '/admin/users',
            currentPage: page,
            hasNext: ITEMS_BY_PAGE * page < totalUsers,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalUsers / ITEMS_BY_PAGE),
            minDate: date.minDate()
        });

    }
    catch (err) {
        error.get500Error(err, next);
    }

}

exports.postDeleteUser = (req, res, next) => {

    const userId = req.body.userId;
    User.deleteById(userId)
        .then(() => {

            res.status(200).json({ msg: "successful" });
        })
        .catch(err => error.get500Error(err, next));

}


exports.postChangeUserStatus = (req, res, next) => {

    const userId = req.body.userId;
    let status = req.body.status;
    if (status === 'active') {
        status = 0;
    } else status = 1;
    User.updateActive(userId, status)
        .then(() => {
            res.status(200).json({ msg: "successful" });
        })
        .catch(err => error.get500Error(err, next));

}
exports.getEditProduct = (req, res, next) => {

    const productId = req.params.productId;
    Product.findById(productId)
        .then(([rows, fieldData]) => {

            return res.render('admin/edit-product',
                {
                    pageTitle: 'Izmjena detalja proizvoda',
                    path: '/admin/edit-product',
                    errorMessage: null,
                    product: rows[0],
                    validationErrors: [],
                    path: '/admin/products'
                });

        })
        .catch(err => error.get500Error(err, next));

}

exports.postEditProduct = (req, res, next) => {

    const title = req.body.title;
    const image = req.file;
    const shortDescription = req.body.shortDescription;
    const description = req.body.description;
    const price = req.body.price;
    const productId = req.body.productId;
    const product = new Product(productId, title, null, shortDescription, description, price);



    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product',
            {
                pageTitle: 'Izmjena podataka proizvoda',
                path: '/admin/products',
                errorMessage: errors.array()[0].msg,
                product: product,
                validationErrors: errors.array()
            });

    }


    Product.findById(productId)
        .then(([rows]) => {
            if (!rows[0]) {
                return next('Proizvod nije pronađen,')
            }
            if (image) {
                fileHelper.delete(rows[0].imageUrl);
                product.imageUrl = '/images/' + image.filename;
            }
            return product.update()
                .then(() => {
                    res.redirect('/admin/products');
                })
        })
        .catch(err => error.get500Error(err, next));





}

exports.postDeleteProduct = (req, res, next) => {
    let product = new Product();
    const productId = req.body.productId;
    Product.findById(productId)
        .then(([rows]) => {
            product = rows[0];
            if (!product) {
                return next('Proizvod nije pronađen,')
            }

            product = Product.create(product);
            let sl = product.imageUrl;

            return OrderItem.findByImage(sl)
                .then(([rows]) => {
                    if (!rows[0]) {
                        fileHelper.delete(product.imageUrl);
                    }

                    return Product.deleteById(productId)
                        .then(() => {
                            res.redirect('/admin/products');
                        })


                })



        })
        .catch(err => error.get500Error(err, next));

}




exports.postDeleteOrder = (req, res, next) => {
    const orderId = req.body.orderId;
    let items = [];
    let products;

    OrderItem.findByOrderId(orderId)
        .then(([rows]) => {
            if (rows.length === 0) {
                return next('Ne postoje stavke.');
            }
            items = [...rows];
            return Product.fetchAll()
                .then(([rows]) => {
                    if (rows.length === 0) { return next('Nema proizovda') }
                    products = [...rows];

                    for (s of items) {
                        if (s.imageUrl) {
                            //ako slike nema u proizvodima onda traba izbrisati
                            let index = products.findIndex(
                                sta => sta.imageUrl == s.imageUrl
                            );

                            let pr = products[index];
                            if (!pr) {
                                fileHelper.delete(s.imageUrl);
                            }

                        }
                    }

                    return Order.deleteByIdAdmin(orderId)
                        .then(() => {
                            res.redirect('/admin/orders');

                        });
                }).catch(err => next(err));

        })
        .catch(err => error.get500Error(err, next));

};


exports.getOrderDetails = (req, res, next) => {

    const orderId = req.params.orderId;
    let order = new Order();
    let items;
    Order.findById(orderId)
        .then(([rows, fieldData]) => {
            order = { ...rows[0] };
            return OrderItem.findByOrderId(orderId);
        })
        .then(([rows, fieldData]) => {
            items = [...rows];
            order.items = items;
            res.render('admin/order-details', { pageTitle: order.title, order: order, path: '/admin/order-details/' + orderId });

        })

        .catch(err => error.get500Error(err, next));

};


exports.getOrderItemDetails = (req, res, next) => {

    const itemId = req.params.orderItemId;
    let item = new OrderItem();

    OrderItem.findById(itemId)
        .then(([rows, fieldData]) => {
            item = { ...rows[0] };
            res.render('admin/order-item-details', { pageTitle: item.title, item: item, path: '/admin/order-item/' + itemId });

        })
        .catch(err => error.get500Error(err, next));

};

exports.postChangeOrderStatus = (req, res, next) => {

    const status = req.body.status;
    const orderId = req.body.orderId;
    let order = new Order();
    let reasonForRefusal = null;
    order.id = orderId;
    order.status = status;
    if (status == 'odbijena') {
        reasonForRefusal = req.body.reasonForRefusal;

    }

    order.reasonForRefusal = reasonForRefusal;
    order.updateStatus()
        .then(() => {
            res.redirect('/admin/orders');
        })
        .catch(err => error.get500Error(err, next));

};



exports.getInvoice = (req, res, next) => {

    const orderId = req.params.orderId;
    const invoiceName = 'faktura' + '_' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName); //konstruisemo sa path da bi radilo na svim os
    const font = path.join('data', 'invoices', 'Roboto-Regular.ttf');
    let order = new Order();
    let items = [];

    Order.findById(orderId)
        .then(([rows, fieldData]) => {
            if (rows) {
                order = { ...rows[0] };
                return OrderItem.findByOrderId(orderId)
                    .then(([rows, fieldData]) => {
                        items = [...rows];
                        order.items = items;
                        order.shipping = {
                            name: "",
                            address: `${process.env.ADDRESS_PLACE}`,
                            city: `${process.env.ADDRESS_CITY}`,
                            state: "RS",
                            country: "BA",
                            postal_code: 78244
                        };

                        let pdfDocument = new PDFDocument({ size: "A4", margin: 50, font: font });

                        // prednost streamova je sto ne ucitava citav fajl u memoriju
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
                        // res is writeable stream, pipe readable stream into writeable stream 

                        pdfDocument.pipe(fs.createWriteStream(invoicePath));
                        pdfDocument.pipe(res);

                        pdfInvoice.generateHeader(pdfDocument);
                        pdfInvoice.generateCustomerInformation(pdfDocument, order);
                        pdfInvoice.generateInvoiceTable(pdfDocument, order);
                        pdfInvoice.generateFooter(pdfDocument);

                        pdfDocument.end();

                    })
            } else throw new Error();
        })


        .catch(err => error.get500Error(err, next));





};


exports.postEditUserData = (req, res, next) => {

    const email = req.session.user.email;
    const username = req.session.user.username;

    let name = req.body.name;
    let surname = req.body.surname;
    let phoneNumber = req.body.phoneNumber;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(422).render('admin/my-account', {
            pageTitle: 'Moj nalog',
            path: '/admin/my-account',
            errorMessage: errors.array()[0].msg,
            infoMessage: null,
            oldInput: {
                username: username,
                oldPassword: '',
                newPassword: '',
                confirmationNewPassword: '',
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
    user = new User();
    user.id = req.session.user.id;
    user.name = name;
    user.surname = surname;
    user.phoneNumber = phoneNumber;
    return user.update()
        .then(() => {
            req.session.user.name = name;
            req.session.user.surname = surname;
            req.session.user.phoneNumber = phoneNumber;
            req.flash('info', 'Podaci su sačuvani.')
            res.redirect('/admin/my-account');

        })
        .catch(err => error.get500Error(err, next));


}



exports.postChangePassword = (req, res, next) => {

    const email = req.session.user.email;
    const username = req.session.user.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confirmationNewPassword = req.body.confirmationNewPassword;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/my-account', {
            pageTitle: 'Moj nalog',
            path: '/admin/my-account',
            errorMessage: errors.array()[0].msg,
            infoMessage: null,
            username: username,
            email: email,
            oldInput: {
                username: username,
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmationNewPassword: confirmationNewPassword,
                email: email,

            },
            validationErrors: errors.array()
        });

    }

    let user = new User();

    return bcryptjs.hash(newPassword, 12)
        .then((hash) => {
            user = new User();
            user.password = hash;
            user.id = req.session.user.id;
            return user.updatePassword()
                .then(() => {
                    return transporter.sendMail({
                        to: email,
                        from: `${process.env.SHOP_EMAIL}`,
                        subject: 'Izmjena lozinke naloga',
                        html: `<h2>Izmjenili ste lozinku.</h2>
                        <h3>Korisničko ime: ${username}</h3>
                        `

                    }).then(() => {


                        req.session.destroy(err => {
                            if (err) { error.get500Error(err, next); }
                            res.redirect('/login');
                        })

                    });

                })
                .catch(err => error.get500Error(err, next));




        })
        .catch(err => error.get500Error(err, next));

}



exports.getMyAccount = (req, res, next) => {

    username = req.session.user.username;
    email = req.session.user.email;
    userId = req.session.user.id;
    User.findById(userId)
        .then(([rows]) => {
            res.render('admin/my-account', {
                pageTitle: 'Moj Nalog',
                path: '/admin/my-account',
                errorMessage: null,
                infoMessage: null,
                oldInput: {
                    username: username,
                    oldPassword: '',
                    newPassword: '',
                    confirmationNewPassword: '',
                    email: email,
                    name: rows[0].name,
                    surname: rows[0].surname,
                    phoneNumber: rows[0].phoneNumber
                },
                validationErrors: []

            });
        })
        .catch(err => error.get500Error(err, next));

};


exports.getProcurements = async (req, res, next) => {

    let totalProcurements = 0;
    const page = +req.query.page || 1;
    let offset = (page - 1) * ITEMS_BY_PAGE;

    try {
        const limit = parseInt(ITEMS_BY_PAGE);
        totalProcurements = await Procurement.count();
        const procurements = await Procurement.fetchAllActive(limit, offset);


        res.render('admin/procurements', {
            pageTitle: 'Vaše nabavke',
            procurements: procurements,
            path: '/admin/procurements',
            currentPage: page,
            hasNext: ITEMS_BY_PAGE * page < totalProcurements,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalProcurements / ITEMS_BY_PAGE),
            minDate: date.minDate()
        });

    }
    catch (err) {
        error.get500Error(err, next);
    }

}


exports.postProcurementItem = (req, res, next) => {

    const title = req.body.title;
    const description = req.body.description;
    const quantity = req.body.quantity;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.render('admin/new-procurement-item', {
            pageTitle: 'Nova stavka nabavke',
            oldInput: {
                title: title,
                description: description,
                quantity: quantity
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: [],
            path: '/admin/procurements'
        })

    }


    let item = new ProcurementItem(title, quantity, description);
    let procurement = new Procurement(null, null, null, null, null, 'nova');
    Procurement.findNew()
        .then((procurementDocument) => {
            if (procurementDocument) {
                procurement = procurementDocument;
            }
            else {
                return procurement.save();
            }
        })
        .then(() => {

            if (procurement.items.length > 3) {
                req.flash('error', 'Nabavka treba da ima minimalno jednu, a najviše dvadeset stavki!');
                return res.redirect('/admin/new-procurement-item');
            }

            return item.save(procurement._id)
                .then(() => {
                    procurement.items.push(item);

                    res.render('admin/new-procurement', {
                        pageTitle: 'Nova nabavka',
                        oldInput: {
                            title: '',
                            description: '',
                            date: '',
                            supplier: '',
                            price: ''
                        },
                        errorMessage: null,
                        validationErrors: errors.array(),
                        procurement: procurement,
                        minDate: date.currentDate,
                        path: '/admin/procurements'
                    })

                })

        })
        .catch(err => error.get500Error(err, next));


}

exports.getProcurementDetails = (req, res, next) => {
    const procurementId = req.params.procurementId;
    Procurement.findById(procurementId)
        .then((procurement) => {

            if (!procurement) { return next('Ne postoji trazena procurement'); }

            res.render('admin/procurement-details', { procurement: procurement, pageTitle: 'Detalji nabavke', path: '/admin/procurements' })

        })
        .catch(err => error.get500Error(err, next));

}

exports.getNewProcurementItem = (req, res, next) => {

    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }

    res.render('admin/new-procurement-item', {
        pageTitle: 'Nova stavka nabavke',
        oldInput: {
            title: '',
            description: '',
            quantity: ''
        },
        errorMessage: errorMessage,
        validationErrors: [],
        path: '/admin/procurements'
    })



}

exports.getNewProcurement = (req, res, next) => {

    let procurement;
    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }
    Procurement.findNew()
        .then((procurementDocument) => {
            if (procurementDocument) {
                procurement = procurementDocument;

                res.render('admin/new-procurement', {
                    pageTitle: 'Nova nabavka',
                    oldInput: {
                        title: '',
                        description: '',
                        date: '',
                        supplier: '',
                        price: ''
                    },
                    errorMessage: errorMessage,
                    validationErrors: [],
                    procurement: procurement,
                    minDate: date.dateLastYear(),
                    path: '/admin/procurements'
                })
            }
            else {
                procurement = new Procurement(null, null, null, null, null, 'nova');

                return procurement.save()
                    .then(() => {
                        procurement.items = [];
                        res.render('admin/new-procurement', {
                            pageTitle: 'Nova nabavka',
                            oldInput: {
                                title: '',
                                description: '',
                                date: '',
                                supplier: '',
                                price: ''
                            },
                            errorMessage: null,
                            validationErrors: [],
                            procurement: procurement,
                            minDate: date.currentDate(),
                            path: '/admin/procurements'
                        })

                    })
            }


        })
        .catch(err => error.get500Error(err, next));




};


exports.postProcurement = (req, res, next) => {

    const title = req.body.title;
    const description = req.body.description;
    const supplier = req.body.supplier;
    const date = req.body.date;
    const price = req.body.price;
    const procurementId = req.body.procurementId;

    let errorMessage = req.flash('error');
    if (errorMessage.length > 0) {
        errorMessage = errorMessage[0];
    } else {
        errorMessage = null;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/admin/new-procurement');

    }
    Procurement.findById(procurementId)
        .then((procurements) => {

            if (procurements.items.length < 1 || procurements.items.length > 20) {
                req.flash('error', 'Nabavka treba da ima minimalno jednu, a najviše 20 stavki!');
                return res.redirect('/admin/new-procurement');
            }

            const procurement = new Procurement(title, date, supplier, description, price, 'aktivna');
            procurement.updateNew()
                .then(() => {
                    res.redirect('/admin/procurements');
                })

        })
        .catch(err => error.get500Error(err, next));

};

exports.postDeleteProcurement = (req, res, next) => {

    const procurementId = req.body.procurementId;
    Procurement.deleteById(procurementId)
        .then(() => {
            res.redirect('/admin/procurements');
        })
        .catch(err => error.get500Error(err, next));

};

exports.postDeleteProcurementItem = (req, res, next) => {
    const itemId = req.body.itemId;
    const procurementId = req.body.procurementId;
    let emptyProcurement = true;
    ProcurementItem.deleteById(procurementId, itemId)
        .then((result) => {
            return Procurement.findById(procurementId)
                .then((procurement) => {
                    if (procurement.items.length > 0) {
                        emptyProcurement = false;
                    }
                    res.status(200).json({ msg: "successful", emptyProcurement: emptyProcurement });

                })
        })
        .catch(err => error.get500Error(err, next));

};


