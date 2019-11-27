const fs = require('fs');
const path = require('path');
module.exports.delete = (fileName) =>{
fs.unlink(path.join('public',fileName), (err) => {
    if(err){
        throw (err);
    }
});
}