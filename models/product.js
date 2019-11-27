const db = require('../util/database');
const mysql = require('mysql2');

module.exports = class Product {
    constructor(id, title, imageUrl, shortDescription, description, price) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.imageUrl = imageUrl;
        this.shortDescription = shortDescription;
        this.description = description;
        
    }

    static create(obj) {
        let field = new Product();
        for (let prop in obj) {
            if (field.hasOwnProperty(prop)) {
                field[prop] = obj[prop];
            }
        }

        return field;
    }

    save() {

        return db.execute('INSERT INTO products (title, shortDescription, description, imageUrl, price) VALUES (?, ?, ?, ?,?)',
            [this.title, this.shortDescription, this.description, this.imageUrl, this.price]);

    }

    update() {
        if (this.imageUrl) {
            return db.execute('UPDATE products SET title=?, shortDescription=?, description=?, imageUrl=?, price=? WHERE products.id=?',
                [this.title, this.shortDescription, this.description, this.imageUrl, this.price, this.id]);
        } else {
            return db.execute('UPDATE products SET title=?, shortDescription=?, description=?, price=? WHERE products.id=?',
                [this.title, this.shortDescription, this.description, this.price, this.id]);

        }
    }

    static fetchAll() {
        return db.execute('SELECT * FROM products where deleted=0');

    }

    static deleteById(id) {

        return db.execute('UPDATE products SET deleted=1 WHERE products.id=?', [id]);

    }

    static findById(id) {

        return db.execute('SELECT * FROM products WHERE products.id=? AND deleted=0', [id]);

    }

    static findByImage(slika) {
        return db.execute('SELECT * FROM products WHERE products.imageUrl=? AND products.deleted=0', [slika]);

    }

    static fetchByPage(limit, offset) {
        return db.execute('SELECT * FROM products WHERE deleted=0 LIMIT ? OFFSET ?', [limit, offset]);

    }

    static count() {
        return db.execute('SELECT COUNT(id) AS totalProducts FROM products WHERE deleted=0;');

    }

    static fetchByPageSearch(limit, offset,search) {   
        return db.execute(`SELECT * FROM products WHERE (products.title LIKE ${mysql.escape('%'+search+'%')}) AND deleted=0 LIMIT ? OFFSET ?`, [ limit, offset]);

    }

    static countSearch(search) {
        return db.execute(`SELECT COUNT(id) AS totalProducts FROM products WHERE (products.title LIKE ${mysql.escape('%'+search+'%')}) AND deleted=0;`,[search]);

    }
};