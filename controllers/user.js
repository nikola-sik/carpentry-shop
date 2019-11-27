const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const bcryptjs = require('bcryptjs');
const Product = require('../models/product');
const Order = require('../models/order');
const Message = require('../models/message');
const User = require('../models/user');
const OrderItem = require('../models/order-item');
const date = require('../util/date');
const error = require('../util/error');
const fileHelper = require('../util/file');
const ITEMS_BY_PAGE = process.env.ITEMS_BY_PAGE;

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: `${process.env.SEND_GRID_KEY}`
    }
}));

exports.getOrders = async (req, res, next) => {
    const userId = req.session.user.id;

    let order;
    let orders = [];
    const page = +req.query.page || 1;
    let offset = (page - 1) * ITEMS_BY_PAGE;
    let totalOrders = 0;

    try {
        let [rows] = await Order.count(userId);
        if (rows.length === 0) { return next('Nema narudžbi.'); }
        totalOrders = rows[0].totalOrders;
        const ordersRows = await Order.fetchByPage(userId, ITEMS_BY_PAGE, offset);
        for (r of ordersRows[0]) {
            order = { ...r };
            order.items = [];
            orders.push(order);
        }

        const itemsRows = await OrderItem.fetchAll();

        let items = [...itemsRows[0]];
        for (order of orders) {
            for (item of items) {
                if (item.orderId === order.id) {
                    order.items.push(item);
                }
            }
        }

        res.render('user/orders', {
            pageTitle: 'Vaše narudžbe',
            orders: orders,
            path: '/user/orders',
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

exports.getMessages = (req, res, next) => {

    let messages;
    let username = req.session.user.username;
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    let infoMessage = req.flash('info');;
    if (infoMessage.length > 0) {
        infoMessage = infoMessage[0];
    } else {
        infoMessage = null;
    }

    Message.fetchAll(username)
        .then(([messages]) => {
            messages.forEach(m => { m.sendingTime = m.sendingTime.substring(0, m.sendingTime.lastIndexOf(':')) });

            res.render('user/messages', { pageTitle: 'Poruke', messages: messages, username: username, errorMessage: message, infoMessage: infoMessage, path: '/user/messages' });

        })
        .catch(err => error.get500Error(err, next));

}


exports.postNewMessage = (req, res, next) => {
    const text = req.body.text;
    const username = req.session.user.username;
    let message;
    let recipient;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/user/messages');


    }


    User.findAdmin()
        .then(([rows]) => {
            recipient = rows[0];

            if (!recipient) {

                return new Error('Nije pronađen primalac');
            }
            message = new Message(null, text, date.currentDateTime(), 0, recipient.username, username);

            return message.save()
                .then(([result]) => {
                    req.flash('info', 'Poruka je poslata.');
                    res.redirect('/user/messages');

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

exports.getOrderDetails = (req, res, next) => {

    let order = new Order();
    const orderId = req.params.orderId;


    Order.findById(orderId)
        .then(([rows]) => {
            order = Order.create(rows[0]);
            if (rows.length === 0) { return next('Nije pronađena narudžba.') }
            order.status = rows[0].status;
            order.items = [];
            return OrderItem.findByOrderId(orderId)
                .then(([rows]) => {
                    order.items = rows;
                    res.render('user/order-details', { pageTitle: order.title, order: order, path: '/user/orders' });
                });
        })

        .catch(err => error.get500Error(err, next));


};




exports.getNewOrder = (req, res, next) => {
    let order = new Order();
    let items = new OrderItem();
    const userId = req.session.user.id;
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    Order.findNewOrder(userId)
        .then(([rows, fieldData]) => {
            order = { ...rows[0] };

            if (!(Order.isEmpty(order))) {

                return OrderItem.findByOrderId(order.id);
            }
            else {
                order = new Order();
                order.userId = userId;
                order.totalPrice = 0.0;
                return order.saveNew()
                    .then((result) => {

                        orderId = result[0].insertId;
                        order.id = orderId;

                        return OrderItem.findByOrderId(orderId);
                    })
                    .catch(err => error.get500Error(err, next));
            }
        })
        .then(([rows, fieldData]) => {


            items = [...rows];
            order.items = items;
            order.title = '';
            order.description = '';

            return res.render('user/new-order',
                {
                    pageTitle: 'Nova narudžba',
                    path: '/user/new-order',
                    errorMessage: message,
                    minDate: date.minDate(),
                    order: order,
                    validationErrors: []
                });


        })
        .catch(err => error.get500Error(err, next));
};

exports.postDeleteOrder = (req, res, next) => {
    const orderId = req.body.orderId;
    const status = req.body.status;
    let items = [];
    let products;

    if (status === 'u obradi') {


        OrderItem.findByOrderId(orderId)
            .then(([rows]) => {
                if (rows.length === 0) {
                    return next('Ne postoje stavke.');
                }
                items = [...rows];
                return Product.fetchAll()
                    .then(([rows]) => {
                        if (rows.length === 0) { return next('Nema proizvoda') }
                        products = [...rows];

                        for (s of items) {

                            if (s.imageUrl) {
                                //ako image nema u proizvodima onda traba izbrisati

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
                                res.redirect('/user/orders');

                            });
                    }).catch(err => next(err));



            })

            .catch(err => error.get500Error(err, next));

    } else if (status === 'realizovana') {
        Order.deleteById(orderId)
            .then(() => {
                res.redirect('/user/orders');

            })

            .catch(err => error.get500Error(err, next));
    }
    else {
        res.redirect('/user/orders');
    }
};


exports.postAddProductToOrder = (req, res, next) => {
    const productId = req.body.productId;
    const productTitle = req.body.productTitle;
    const productDescription = req.body.productDescription;
    const productPrice = req.body.productPrice;
    const productImageUrl = req.body.productImageUrl;
    const userId = req.session.user.id;
    let order = new Order();
    let item = new OrderItem();
    let items = [];

    let editedOrderItem = new OrderItem();
    let existingOrderItem = new OrderItem();
    let orderId;
    let price;

    Order.findNewOrder(userId)
        .then(([rows, fieldData]) => {
            order = { ...rows[0] };
            if (!(Order.isEmpty(order))) {

                return OrderItem.findByOrderId(order.id)
                    .then(([rows]) => {

                        if (rows.length > 9) {
                            order.items = [];
                            items = [...rows];
                            order.items = [...items];

                            const existingOrderItemIndex = order.items.findIndex(
                                sta => sta.productId == productId
                            );

                            existingOrderItem = order.items[existingOrderItemIndex];

                            if (!existingOrderItem) {
                                req.flash('error', 'Narudžba ne može imati više od 10 stavki!');
                                return res.redirect('/user/new-order');
                            }
                        }
                        order.totalPrice = parseFloat(parseFloat(order.totalPrice) +
                            parseFloat(productPrice)).toFixed(2);
                        order = Order.create(order);
                        return order.updateTotalPrice()
                            .then(() => {
                                return OrderItem.findByOrderId(order.id);
                            });

                    });
            }
            else {

                order = new Order();
                order.userId = userId;
                order.totalPrice = productPrice;
                return order.saveNew()
                    .then((result) => {
                        orderId = result[0].insertId;
                        order.id = orderId;
                        return OrderItem.findByOrderId(orderId);
                    })
                    .catch(err => error.get500Error(err, next));
            }
        })
        .then(([rows, fieldData]) => {
            //kada dobijemo items iz baze, zatim provjervamo da li se vec nalazi na narudzbi, ako vec postoji uvecamo kolicinu 
            order.items = [];
            items = [...rows];
            order.items = [...items];

            const existingOrderItemIndex = order.items.findIndex(
                sta => sta.productId == productId
            );

            existingOrderItem = order.items[existingOrderItemIndex];

            if (existingOrderItem) {

                editedOrderItem = { ...existingOrderItem };
                editedOrderItem.quantity = editedOrderItem.quantity + 1;
                order.items = [...order.items];
                order.items[existingOrderItemIndex] = editedOrderItem;
                editedOrderItem = OrderItem.create(editedOrderItem);

                editedOrderItem.update()
                    .then(() => {
                        order.title = '';
                        order.description = '';

                        return res.render('user/new-order',
                            {
                                pageTitle: 'Nova narudžba',
                                path: '/user/new-order',
                                errorMessage: null,
                                minDate: date.minDate(),
                                order: order,
                                validationErrors: []
                            });
                    });
            } else {
                //ako se proizvod ne nalazi na narudzbi, upisujemo u bazu novu stavku
                item = new OrderItem(productTitle, productDescription, productImageUrl, productPrice, 1, order.id, productId);
                item.save()
                    .then((result) => {

                        let idItem = result[0].insertId;
                        item.id = idItem;
                        order.items = [...order.items, item];
                        order.title = '';
                        order.description = '';

                        return res.render('user/new-order',
                            {
                                pageTitle: 'Nova narudžba',
                                path: '/user/new-order',
                                errorMessage: null,
                                minDate: date.minDate(),
                                order: order,
                                validationErrors: []
                            });
                    });
            }

        })

        .catch(err => error.get500Error(err, next));




};

exports.postSaveOrder = (req, res, next) => {

    orderId = req.body.orderId;
    title = req.body.title;
    description = req.body.description;
    dateOfDelivery = req.body.dateOfDelivery;
    userId = req.session.user.id;
    totalPrice = req.body.totalPrice;
    let order = new Order(orderId, title, description, dateOfDelivery, totalPrice, userId);
    order.creationDate = date.currentDate();


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/user/new-order');

    }
    order = new Order(orderId, title, description, dateOfDelivery, totalPrice, userId);
    OrderItem.findByOrderId(orderId)
        .then(([rows, fieldData]) => {

            if (rows.length >= 0) {
                return order.save()
                    .then(() => {
                        res.redirect('/user/orders');
                    })

            } else {
                req.flash('error', "Nema dodatih stavki.");
                return res.redirect('/user/new-order');
            }

        })
        .catch(err => error.get500Error(err, next));
};

exports.getNewOrderItem = (req, res, next) => {

    let order;
    userId = req.session.user.id;

    Order.findNewOrder(userId)
        .then(([rows, fieldData]) => {
            order = { ...rows[0] };
            order = Order.create(order);
            item = new OrderItem('', '', '', 0, 1, order.id, null);


            res.render('user/new-order-item',
                {
                    pageTitle: 'Nova stavka narudžbe',
                    path: '/user/new-order-item',
                    errorMessage: null,
                    item: item,
                    order: order,
                    validationErrors: []
                });


        })
        .catch(err => error.get500Error(err, next));

};



exports.postNewOrderItem = (req, res, next) => {


    let item;
    let orderId = req.body.orderId;
    let title = req.body.title;
    let description = req.body.description;
    let image = req.file;
    let price = req.body.price;
    let totalPrice = req.body.totalPrice;
    let imageUrl;
    let order = new Order();
    order.id = orderId;
    let quantity = req.body.quantity;
    item = new OrderItem(title, description, imageUrl, price, quantity, orderId, null);

    if (req.uploadImageError) {
        order.totalPrice = totalPrice;
        return res.status(422).render('user/new-order-item',
            {
                pageTitle: 'Nova stavka',
                path: '/user/new-order-item',
                errorMessage: 'Dozvoljeni formati slike su png, jpg i jpeg veličine do 10MB.',
                item: item,
                order: order,
                validationErrors: []
            });
    } else if (image) imageUrl = '/images/' + image.filename;
    else imageUrl = null;



    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        order.totalPrice = totalPrice;
        return res.status(422).render('user/new-order-item',
            {
                pageTitle: 'Nova stavka',
                path: '/user/new-order-item',
                errorMessage: errors.array()[0].msg,
                item: item,
                order: order,
                validationErrors: errors.array()
            });

    }


    price = parseFloat(price);
    item = new OrderItem(title, description, imageUrl, price, quantity, orderId, null);


    return OrderItem.findByOrderId(order.id)
        .then(([rows]) => {

            if (rows.length > 9) {
                req.flash('error', 'Narudžba ne može imati više od 10 stavki!');
                return res.redirect('/user/new-order');
            }

            return item.save()
                .then(() => {
                    order.totalPrice = parseFloat(totalPrice) + (parseFloat(price) * quantity);

                    return order.updateTotalPrice();
                })
                .then(() => {
                    res.redirect('/user/new-order');
                })
        })
        .catch(err => { error.get500Error(err, next); });

};


exports.postDeleteOrderItem = (req, res, next) => {

    let itemId = req.body.itemId;
    let orderId;
    let item = new OrderItem();
    let order = new Order();
    order.id = orderId;

    OrderItem.findById(itemId)
        .then(([row]) => {
            if (!row[0]) {
                return next('Stavka ne postoji');
            }
            item = OrderItem.create(row[0]);

            if (item.imageUrl) {
                //ako slike nema u proizvodima onda traba izbrisati
                Product.findByImage(item.imageUrl)
                    .then(([rows]) => {
                        if (!rows[0]) {
                            fileHelper.delete(item.imageUrl);
                        }
                    }).catch(err => next(err));
            }

            return OrderItem.deleteById(itemId)
                .then(() => {

                    return Order.findById(item.orderId)
                        .then(([row]) => {
                            order = Order.create(row[0]);
                            order.totalPrice = parseFloat(order.totalPrice) - (parseFloat(item.price) * item.quantity);
                            return order.updateTotalPrice()
                                .then(() => {
                                    return OrderItem.findByOrderId(order.id)
                                        .then(([rows, fieldData]) => {
                                            let emptyOrder = false;

                                            if (rows.length == 0) {
                                                emptyOrder = true;
                                            }
                                            res.status(200).json({ msg: "successful", totalPrice: order.totalPrice.toFixed(2), emptyOrder: emptyOrder });

                                        })

                                })
                        })
                })

        })
        .catch(err => { error.get500Error(err, next); });


};

exports.getOrderItemDetails = (req, res, next) => {

    let item = new OrderItem();
    let itemId = req.params.orderItemId;


    OrderItem.findById(itemId)
        .then(([rows, fieldData]) => {
            item = { ...rows[0] };

            res.render('user/order-item-details', { pageTitle: 'Detalji items', item: item, path: '/user/order-item-details/' + itemId });


        })
        .catch(err => error.get500Error(err, next));

};



exports.postIncreaseQuantity = (req, res, next) => {


    let itemId = req.body.itemId;
    let quantity;
    let orderId;
    let price;

    let totalPrice;


    let item = new OrderItem();
    let order = new Order();
    order.id = orderId;

    OrderItem.findById(itemId)
        .then(([row]) => {
            item = OrderItem.create(row[0]);

            item.quantity = ++item.quantity;
            return item.update();
        })
        .then(() => {
            return Order.findById(item.orderId);
        })
        .then(([row]) => {
            order.totalPrice = parseFloat(row[0].totalPrice) + parseFloat(item.price);
            order.id = item.orderId;
            order = Order.create(order);

            return order.updateTotalPrice();

        })
        .then(() => {


            res.status(200).json({ msg: "successful", quantity: item.quantity, totalPrice: order.totalPrice.toFixed(2) });
        })
        .catch(err => {
            res.status(500).json({ msg: "greska" });
        });

};


exports.postDecreaseQuantity = (req, res, next) => {


    let itemId = req.body.itemId;
    let quantity;
    let orderId;
    let price;

    let totalPrice;


    let item = new OrderItem();
    let order = new Order();
    order.id = orderId;
    order.totalPrice = totalPrice;
    OrderItem.findById(itemId)
        .then(([row]) => {

            item = OrderItem.create(row[0]);
            if (item.quantity > 1) {
                item.quantity = --item.quantity;

                return item.update()
                    .then(() => {

                        return Order.findById(item.orderId);

                    })
                    .then(([row]) => {
                        order.totalPrice = parseFloat(row[0].totalPrice) - parseFloat(item.price);
                        order.id = item.orderId;
                        order = Order.create(order);
                        return order.updateTotalPrice();

                    })
                    .catch(err => error.get500Error(err, next));
            }

        })

        .then(() => {

            return Order.findById(item.orderId);
        })
        .then(([row, fieldData]) => {
            order = Order.create(row[0]);

            res.status(200).json({ msg: "successful", quantity: item.quantity, totalPrice: order.totalPrice });

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

        return res.status(422).render('user/my-account', {
            pageTitle: 'Moj nalog',
            path: '/user/my-account',
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
            res.redirect('/user/my-account');

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

        return res.status(422).render('user/my-account', {
            pageTitle: 'Moj nalog',
            path: '/user/my-account',
            errorMessage: errors.array()[0].msg,
            infoMessage: null,
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
                        <h3>Korisničko ime: ${username}</h3>`

                    }).then(() => {


                        req.session.destroy(err => {
                            if (err) { error.get500Error(err, next); }
                            res.redirect('/login');
                        })

                    });

                });
        })
        .catch(err => error.get500Error(err, next));

}



exports.getMyAccount = (req, res, next) => {

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

    username = req.session.user.username;
    email = req.session.user.email;
    userId = req.session.user.id;
    User.findById(userId)
        .then(([rows]) => {
            res.render('user/my-account', {
                pageTitle: 'Moj Nalog',
                path: '/user/my-account',
                errorMessage: message,
                infoMessage: infoMessage,
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