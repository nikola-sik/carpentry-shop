const db = require('../util/database');


module.exports = class Message {
    constructor(id, text, sendingTime, readed, recipient, sender) {
        this.id = id;
        this.text = text;
        this.sendingTime = sendingTime;
        this.readed = readed;
        this.recipient = recipient;
        this.sender = sender;
    }

    static create(obj) {
        let field = new Message();
        for (let prop in obj) {
            if (field.hasOwnProperty(prop)) {
                field[prop] = obj[prop];
            }
        }

        return field;
    }

    save() {

        return db.execute('INSERT INTO messages (text, sendingTime, readed, recipient, sender) VALUES (?, ?, ?, ?,?)',
            [this.text, this.sendingTime, this.readed, this.recipient, this.sender]);

    }

    updateToReaded() {

        return db.execute('UPDATE messages SET readed=1 WHERE messages.id=?', [this.id]);

    }


    static fetchAll(username) {
        return db.execute('SELECT * FROM messages where messages.deleted=0 AND ( messages.sender=? OR messages.recipient=?);', [username, username]);

    }

    static deleteById(id) {

        return db.execute('UPDATE messages SET deleted=1 WHERE messages.id=?', [id]);

    }

    static deleteByIdAdmin(id) {

        return db.execute('UPDATE messages SET deletedByAdmin=1 WHERE messages.id=?', [id]);

    }

    static findById(id) {

        return db.execute('SELECT * FROM messages WHERE messages.id=? AND deleted=0', [id]);
    }

    static findUnreadedMessagesUser(username) {

        return db.execute('SELECT * FROM messages WHERE messages.recipient=? AND deleted=0 AND readed=0', [username]);
    }

    static findUnreadedMessagesAdmin(username) {

        return db.execute('SELECT * FROM messages WHERE messages.recipient=? AND deletedByAdmin=0 AND readed=0', [username]);
    }

    static findAllMessagesAdmin() {

        return db.execute('SELECT COUNT(messages.id) AS numberOfUnreaded, messages.sender FROM messages JOIN persons ON messages.sender=persons.username WHERE messages.deletedByAdmin=0 AND persons.admin=0 GROUP BY messages.sender;');
    }


    static findMessagesOfUserAdmin(username) {

        return db.execute('SELECT * FROM messages where messages.deletedByAdmin=0 AND ( messages.sender=? OR messages.recipient=?);', [username, username]);
    }

    static findSendersAndAdmin(username) {

        return db.execute('(SELECT messages.recipient AS username FROM messages JOIN persons ON messages.recipient=persons.username  WHERE (messages.deletedByAdmin=0 AND (messages.recipient=? OR messages.sender=?) AND persons.active=1) GROUP BY messages.recipient) UNION (SELECT  messages.sender AS username  FROM messages JOIN persons on messages.sender=persons.username   WHERE (messages.deletedByAdmin=0 AND (messages.recipient=? OR messages.sender=?) AND persons.active=1) GROUP BY messages.sender);', [username, username, username, username]);
    }

    static findUnreadedMessages(admin) {

        return db.execute('SELECT COUNT(messages.id) AS numberOfUnreaded, messages.sender FROM messages JOIN persons ON messages.sender=persons.username  WHERE (messages.deletedByAdmin=0 AND messages.recipient=? AND messages.readed=0 AND persons.active=1)  GROUP BY messages.sender ;', [admin]);
    }


    static deleteByIdAdminAll(admin, persons) {

        return db.execute('UPDATE messages SET messages.deletedByAdmin=1  WHERE ((messages.recipient=? AND messages.sender=?) OR (messages.sender=? AND messages.recipient=?));', [admin, persons, admin, persons]);

    }

    static updateByIdAdminAll(admin, persons) {

        return db.execute('UPDATE messages SET messages.readed=1  WHERE ((messages.recipient=? AND messages.sender=?) AND messages.deletedByAdmin=0);', [admin, persons]);

    }
};