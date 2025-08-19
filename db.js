//import mysql2 from 'mysql2';
import mysql from 'mysql2';

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'n3u3da!',
    database: 'coco'
});
/*
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});
*/
export default db;