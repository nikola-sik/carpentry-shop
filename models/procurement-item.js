
const getDb = require('../util/databaseMongoDB').getDb;
const error = require('../util/error');
const mongodb = require('mongodb');

module.exports = class ProcurementItem {
   constructor(title, quantity, description, _id) {
      this._id = new mongodb.ObjectID();
      this.title = title;
      this.quantity = quantity;
      this.description = description;
   }


   save(id) {
      const db = getDb();
      return db.collection('procurements').updateOne({ _id: new mongodb.ObjectID(id) }, {
         $push: { items: this }
      })
         .then((result) => {
            return result;
         })
         .catch(err => error.get500Error(err, next));
   }


   static deleteById(idProcurement, idItem) {
      const db = getDb();
      return db.collection('procurements').updateOne({ _id: new mongodb.ObjectID(idProcurement) }, {
         $pull: { items: { _id: new mongodb.ObjectID(idItem) } }
      })
         .then((items) => {
            return items;
         })
         .catch(err => error.get500Error(err, next));
   }

};