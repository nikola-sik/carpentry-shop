const getDb = require('../util/databaseMongoDB').getDb;
const error = require('../util/error');
const mongodb = require('mongodb');
module.exports = class Procurement {
    constructor(title, date, supplier, description, price, status, items = []) {

        this.title = title;
        this.date = date;
        this.supplier = supplier;
        this.description = description;
        this.price = price;
        this.status = status;
        this.items = items;
    }


    save() {
        const db = getDb();
        return db.collection('procurements').insertOne(this).
            then((result) => {

            })
            .catch(err => error.get500Error(err, next));
    }

    updateNew() {
        const db = getDb();
        return db.collection('procurements').updateOne(
            { status: "nova" },
            {
                $set: {
                    title: this.title,
                    description: this.description,
                    date: this.date,
                    supplier: this.supplier,
                    price: this.price,
                    status: this.status
                }
            }
        )
            .then((result) => {

            })
            .catch(err => error.get500Error(err, next));
    }

    static findNew() {
        const db = getDb();
        return db.collection('procurements').find({ status: 'nova' }).next()
            .then((procurements) => {

                return procurements;
            })
            .catch(err => error.get500Error(err, next));
    }

    static fetchAll(limit, offset) {
        const db = getDb();
        return db.collection('procurements').find().toArray()
            .then((procurements) => {

                return procurements;
            })
            .catch(err => error.get500Error(err, next));
    }

    static fetchAllActive(limit, offset) {
        const db = getDb();
        return db.collection('procurements').find({ status: 'aktivna' }).skip(offset).limit(limit).toArray()
            .then((procurements) => {

                return procurements;
            })
            .catch(err => error.get500Error(err, next));
    }


    static findById(id) {
        const db = getDb();
        return db.collection('procurements').find({ _id: new mongodb.ObjectID(id) }).next()
            .then((procurements) => {

                return procurements;
            })
            .catch(err => error.get500Error(err, next));
    }

    static deleteById(id) {
        const db = getDb();
        return db.collection('procurements').deleteOne({ _id: new mongodb.ObjectID(id) })
            .then((result) => {

                return result;
            })
            .catch(err => error.get500Error(err, next));
    }

    static count(){
        const db = getDb();
        return db.collection('procurements').countDocuments({ status: 'aktivna' })
            .then((totalProcurements) => {

                return totalProcurements;
            })
            .catch(err => error.get500Error(err, next));
    }

};