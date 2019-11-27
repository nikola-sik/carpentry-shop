const Proizvod = require('./product');
const db = require('../util/database');


module.exports = class OrderItem {

    constructor(title, description, imageUrl, price, quantity, orderId, productId) {

        this.id = null;
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.orderId = orderId;
        this.price = price;
        this.quantity = quantity;
        this.productId = productId;



    };

    static create(obj) {
        let field = new OrderItem();
        for (let prop in obj) {
            if (field.hasOwnProperty(prop)) {
                field[prop] = obj[prop];
            }
        }

        return field;
    }




    save() {

        return db.execute('INSERT INTO order_items (title, description, imageUrl, price, quantity, productId,orderId) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [this.title, this.description, this.imageUrl, this.price, this.quantity, this.productId, this.orderId]);

    }

    update() {

        return db.execute('UPDATE order_items SET quantity=? WHERE order_items.id=?',
            [this.quantity, this.id]);

    }


    static fetchAll() {
        return db.execute('SELECT * FROM order_items WHERE order_items.deleted=0');

    }

    static findById(id) {
        return db.execute('SELECT * FROM order_items WHERE order_items.id=? AND order_items.deleted=0', [id]);

    }

    static findByOrderId(id) {
        return db.execute('SELECT * FROM order_items WHERE order_items.orderId=? AND order_items.deleted=0', [id]);

    }

    saveAndFetch() {
        return db.execute('INSERT INTO order_items (title, description, imageUrl, price, quantity, productId,orderId) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [this.title, this.description, this.imageUrl, this.price, this.quantity, this.productId, this.orderId]);


    }

    static deleteById(id) {

        return db.execute('UPDATE order_items SET deleted=1 WHERE order_items.id=?', [id]);

    }
    static findByImage(image) {
        return db.execute('SELECT * FROM order_items WHERE order_items.imageUrl=? AND order_items.deleted=0', [image]);

    }

    static deleteByOrderId(id) {

        return db.execute('UPDATE order_items SET deleted=1 WHERE orderId=?', [id]);

    }

};