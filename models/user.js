const db = require('../util/database');


module.exports = class User {
    constructor(id, name, surname, username, password, email, phoneNumber, admin) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.username = username;
        this.password = password;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.admin = admin;
    }

    static create(obj) {
        let field = new User();
        for (let prop in obj) {
            if (field.hasOwnProperty(prop)) {
                field[prop] = obj[prop];
            }
        }

        return field;
    }

    save() {
        return db.execute('INSERT INTO persons (name, surname, username, password, email, phoneNumber, token, tokenExpirationTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [this.name, this.surname, this.username, this.password, this.email, this.phoneNumber, this.token, this.tokenExpirationTime]);


    }

    update() {

        return db.execute('UPDATE persons SET name=?, surname=?, phoneNumber=? WHERE  persons.id=?',
            [this.name, this.surname, this.phoneNumber, this.id]);

    }

    updatePassword() {

        return db.execute('UPDATE persons SET password=? WHERE  persons.id=?',
            [this.password, this.id]);

    }

    static updateActive(id, active) {

        return db.execute('UPDATE persons SET active=? WHERE  persons.id=?',
            [active, id]);

    }

    static fetchAll() {
        return db.execute('SELECT * FROM persons WHERE deleted=0 AND admin=0');

    }

    static fetchAllActive() {
        return db.execute('SELECT * FROM persons WHERE deleted=0 AND admin=0 AND active=1');

    }

    static deleteById(id) {

        return db.execute('UPDATE persons SET active=0, deleted=1 WHERE  persons.id=?', [id]);

    }

    static findById(id) {

        return db.execute('SELECT * FROM persons WHERE  persons.id=? AND active=1  AND deleted=0', [id]);

    }

    static findByUsername(username) {

        return db.execute('SELECT * FROM persons WHERE  persons.username=? AND active=1 AND deleted=0', [username]);

    }

    static findByUsernameWithoutAdmin(username) {

        return db.execute('SELECT * FROM persons WHERE  persons.username=? AND active=1 AND deleted=0 AND persons.admin=0', [username]);

    }

    static findByUsernameAll(username) {

        return db.execute('SELECT * FROM persons WHERE  persons.username=?', [username]);

    }


    static findByEmail(email) {

        return db.execute('SELECT * FROM persons WHERE  persons.email=?', [email]);

    }
    static findByEmailAll(email) {

        return db.execute('SELECT * FROM persons WHERE  persons.email=?', [email]);

    }

    static findByToken(token) {

        return db.execute('SELECT * FROM persons WHERE  persons.token=?', [token]);

    }
    static findAdmin() {

        return db.execute('SELECT * FROM persons WHERE  persons.admin=1 AND  persons.active=1 AND deleted=0');
    }

    static fetchByPage(limit, offset) {
        return db.execute('SELECT * FROM persons WHERE persons.deleted=0 AND admin=0 LIMIT ? OFFSET ?', [ limit, offset]);

    }

    static count() {
        return db.execute(`SELECT COUNT(persons.id) AS totalUsers FROM persons WHERE persons.deleted=0 AND admin=0`);
    }

};