
const { createConnection } = require('mysql');
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded({ extended: true });
const app = express();
var bcryptjs = require('bcryptjs');
const addMonths = require('date-fns/addMonths');
app.use(encoder);
app.use(bodyParser.json());
app.set('view engine', 'ejs');
var path = require('path')
app.use(express.static(path.join(__dirname, '/public')));
const connection = createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "water"
});


// connect to the database
connection.connect(function (error) {
    if (error) throw error
    else console.log("connected to the database successfully!")
});
//data from db to html
app.get('/cdata', function (req, res) {
    const sql = 'SELECT * FROM customer';
    connection.query(sql, function (error, results, fields) {
        if (error) throw error;
        // Pass the results to the EJS template
        res.render('index', { results: results });
    });
});
app.post('/comdata', async function (req, res) {
    // Use a SELECT statement to retrieve data from the database
    const sql = 'SELECT * FROM complaints';
    const adminId = req.body.adminid;
    connection.query(sql, function (error, results, fields) {
        if (error) throw error;
        // Pass the results to the EJS template
        res.render('index2', { results: results, adminId: adminId });
    });
});
app.get('/billdata', function (req, res) {
    // Use a SELECT statement to retrieve data from the database
    const sql = 'SELECT * FROM bill';
    connection.query(sql, function (error, results, fields) {
        if (error) throw error;

        // Pass the results to the EJS template
        res.render('index2', { results: results });
    });
});


app.post("/login", function (req, res) {
    var username = req.body.ausername;
    var password = req.body.apassword;

    connection.query("select * from admin where ausername = ? and apassword = ?", [username, password], function (error, results, fields) {
        if (results.length > 0) {
            const adminId1 = results[0].adminId;
            res.render("test11", { adminId1: adminId1 });
        } else {
            res.redirect("/");
        }
        res.end();
    })
})

app.post("/asignup", async function (req, res) {
    var name = req.body.name;
    var address = req.body.address;
    var phone = req.body.phone;
    var username = req.body.username;
    var password = req.body.password;
    connection.query("select * from admin where ausername = ?", [username], function (error, results, fields) {
        if (results.length > 0) {
            res.status(400).json({
                message: "user already exists"
            });
        } else {
            var sql = 'insert into admin(ausername,apassword,aname,aaddress,aphone) values("' + username + '","' + password + '","' + name + '","' + address + '",' + phone + ')';
            connection.query(sql, function (err, result) {
                if (err) throw err;
                res.redirect("index.html");
            });
        }
    })
})
app.post("/signup", async function (req, res) {
    var name = req.body.name;
    var address = req.body.address;
    var phone = req.body.phone;
    var username = req.body.username;
    var pass = req.body.password;
    var password = await bcryptjs.hash(pass, 10)
    connection.query("select * from customer where cusername = ?", [username], function (error, results, fields) {
        if (results.length > 0) {
            res.status(400).json({
                message: "user already exists"
            });
        } else {
            var sql = 'insert into customer(cusername,cpassword,cname,caddress,cphone) values("' + username + '","' + password + '","' + name + '","' + address + '",' + phone + ')';
            connection.query(sql, function (err, result) {
                if (err) throw err;
                res.redirect("/index.html");
            });
        }
    })
})
app.post("/updateUnits", async function (req, res) {
    const custId=req.body.custid;
    const units=req.body.units;
    var sql = "update customer set units = "+units+" where custId = " + custId + ";";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json({          //200 valid request
            message: "Units Updated"
        })
    });
})

app.post("/updateStatus", async function (req, res) {
    const complaintId = req.body.complaintid;
    const adminId = req.body.adminid;
    const finishDate = new Date().toISOString().slice(0, 10);
    var sql = "update complaints set cstatus="+"'Done'"+", adminId = " + adminId + ", finishDate = '"+finishDate+"' where complaintId = " + complaintId + ";";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json({          //200 valid request
            message: "complaint updated"
        })
    });
})
app.post("/clogin", async function (req, res) {
    const user = req.body.username
    const password = req.body.password
    connection.query("select * from customer where cusername = ?", [user], async function (error, results, fields) {
        if (results.length == 0) {
            console.log("--------> User does not exist")
            res.redirect("/");
        } else {
            const hashedPassword = results[0].cpassword
            const title = results[0]
            //get the hashedPassword from result
            if (await bcryptjs.compare(password, hashedPassword)) {
                console.log("---------> Login Successful")
                res.render('test2', { title: title });
            }
            else {
                console.log("---------> Password Incorrect")
                res.send("Password incorrect!")
            } //end 
        }
    })
})

app.post("/complaint", function (req, res) {
    let custId = req.body.custid;
    res.render('complaint1', { custId: custId });
})

app.post("/getcomplaint", function (req, res) {
    let custId = req.body.custid;
    var complaint = req.body.complaint;
    var issueDate = new Date().toISOString().slice(0, 10);
    var sql = "insert into complaints(custId,complaint,issueDate) values(" + custId + ",'" + complaint + "','" + issueDate + "');";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json({          //200 valid request
            message: "complaint raised successfully"
        })
    });
})

app.post("/cbill", function (req, res) {
    res.render("bill");
})

//bill html
app.post("/bill", function (req, res) {
    var custId = req.body.custid;
    var amount = req.body.amount;
    var issueDate = new Date();
    var dueDate = addMonths(issueDate, 1);
    var issueDate = issueDate.toISOString().slice(0, 10);
    var dueDate = dueDate.toISOString().slice(0, 10);
    var sql = 'insert into bill(custId,issueDate,dueDate,amount) values(' + custId + ',"' + issueDate + '","' + dueDate + '",' + amount + ');';
    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.render("bill");
    });
})

app.post("/paybill", function (req, res) {
    var custId = req.body.custid;
    var paymentDate = new Date().toISOString().slice(0, 10);
    var sql = "update bill set paymentDate = '" +paymentDate+ "', paymentMethod = 'Online' where custId = " +custId+ ";";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.send({ message: 'Bill Paid successfully' });
    });
})

app.post("/delete", function (req, res) {
    var cust = req.body.custid;
    var sql="DELETE FROM customer WHERE custId="+cust+";";
    connection.query(sql, function (error, results) {
        if (error) {
            // Return an error response if there was a problem
            return res.status(500).send({ error });
          }
          // Return a success response
          res.send({ message: 'Row deleted successfully' });
    })
})
// set app port 
app.listen(3305,"10.12.35.243");