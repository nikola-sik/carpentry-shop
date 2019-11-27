const Product = require('./product');
const OrderItem = require('../models/order-item');
const db = require('../util/database');
const date = require('../util/date');

module.exports = class Order {




    constructor(id, title, description, dateOfDelivery, totalPrice, userId, items = []) {

        this.id = id;
        this.title = title;
        this.description = description;
        this.dateOfDelivery = dateOfDelivery;
        this.userId = userId;
        this.totalPrice = totalPrice;
        this.creationDate = date.currentDate();
        this.items = items;


    };


    save() {

        return db.execute('UPDATE orders SET title=?, description=?,creationDate=?, dateOfDelivery=?,status="u obradi",totalPrice=?,personId=? WHERE orders.id=?',
            [this.title, this.description, this.creationDate, this.dateOfDelivery, this.totalPrice, this.userId, this.id]);

    }

    saveNew() {

        return db.execute('INSERT INTO orders (personId,totalPrice) VALUES (?,?)',
            [this.userId, this.totalPrice]);

    }

    update() {

        return db.execute('UPDATE orders SET title=?, description=?, dateOfDelivery=?, totalPrice=?, personId=? WHERE orders.id=?',
            [this.title, this.description, this.dateOfDelivery, this.totalPrice, this.userId, this.id]);


    }

    updateTotalPrice() {

        return db.execute('UPDATE orders SET totalPrice=? WHERE orders.id=?',
            [this.totalPrice, this.id]);


    }

    updateStatus() {

        return db.execute('UPDATE orders SET status=?,reasonForRefusal=? WHERE orders.id=?',
            [this.status, this.reasonForRefusal, this.id]);


    }

    static create(obj) {
        let field = new Order();
        for (let prop in obj) {
            if (field.hasOwnProperty(prop)) {
                field[prop] = obj[prop];
            }
        }

        return field;
    }

    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }



    static fetchAllByUserId(id) {
        return db.execute('SELECT * FROM orders WHERE orders.deleted=0 AND orders.visibleToUser=1 AND orders.status != "nova" AND personId=?', [id]);

    }


    static fetchAllAdmin() {
        return db.execute(' SELECT orders.id, orders.title, orders.description, orders.creationDate, orders.dateOfDelivery, orders.status, orders.totalPrice, orders.reasonForRefusal, persons.username FROM orders  JOIN persons ON orders.personId=persons.id WHERE orders.deleted=0 AND orders.status != "nova" AND persons.active=1;');

    }

    static findById(id) {
        return db.execute('SELECT * FROM orders WHERE orders.id=?', [id]);

    }

    static findNewOrder(id) {
        return db.execute('SELECT * FROM orders WHERE orders.personId=? AND status="nova"', [id]);

    }

    saveAndFetch() {
        return db.execute('INSERT INTO orders (title, description,creationDate, dateOfDelivery,productId,totalPrice,personId) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [this.title, this.description, this.creationDate, this.dateOfDelivery, this.totalPrice, this.userId]);

    }

    static deleteById(id) {

        return db.execute('UPDATE orders SET orders.visibleToUser=0 WHERE  orders.id=?', [id]);

    }
    static deleteByIdAdmin(id) {

        return db.execute('UPDATE order_items ,orders SET order_items.deleted=1,orders.deleted=1,orders.visibleToUser=0 WHERE order_items.orderId=? AND orders.id=?', [id, id]);

    }

    static fetchByPage(id, limit, offset) {
        return db.execute('SELECT * FROM orders WHERE orders.deleted=0 AND orders.visibleToUser=1 AND orders.status != "nova" AND personId=? LIMIT ? OFFSET ?', [id, limit, offset]);

    }

    static count(id) {
        return db.execute(`SELECT COUNT(orders.id) AS totalOrders FROM orders WHERE orders.deleted=0 AND orders.visibleToUser=1 AND orders.status != 'nova' AND orders.personId=?`, [id]);
    }


    static fetchByPageAdmin(limit, offset) {
        return db.execute('SELECT * FROM orders WHERE orders.deleted=0 AND orders.status != "nova" LIMIT ? OFFSET ?', [ limit, offset]);

    }

    static countAdmin() {
        return db.execute(`SELECT COUNT(orders.id) AS totalOrders FROM orders WHERE orders.deleted=0 AND orders.status != 'nova'`);
    }


};

