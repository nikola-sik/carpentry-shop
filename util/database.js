const mysql = require('mysql2');


const pool = mysql.createPool({
host: `${process.env.HOST}`,
user: `${process.env.MYSQL_USER}`,
database: `${process.env.DATABASE_NAME}`,
password: `${process.env.MYSQL_PASSWORD}`,
dateStrings:true
});

module.exports = pool.promise();