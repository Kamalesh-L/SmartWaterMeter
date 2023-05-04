// app.js

const express = require('express');
const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Connect to the MySQL database
const mysql = require('mysql');
const pool  = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : 'kelvin273',
  database : 'nodejs'
});
app.use(express.static(path.join(__dirname, '/public')));
// Define a route that will render the EJS template
app.get('/data', function(req, res) {
  // Use a SELECT statement to retrieve data from the database
  const sql = 'SELECT * FROM customer';
  pool.query(sql, function(error, results, fields) {
    if (error) throw error;

    // Pass the results to the EJS template
    res.render('index', { results: results });
  });
});

app.listen(3000, function() {
  console.log('App listening on port 3000!');
});
