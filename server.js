// require("./src/server");
// import express from "express";
// import cors from "cors";
// import mysql from "mysql2";
// import bodyParser from "body-parser";
// const app = express();
// app.use(bodyParser.json());
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

// const db = mysql.createConnection({
//   host: "127.0.0.1",
//   user: "root",
//   password: "",
//   database: "test",
// });
// db.connect((err) => {
//   if (err) {
//     console.log("DB connection error", err);
//   } else {
//     console.log("MySQL Connected");
//   }
// });

// app.post("/booking", (req, res) => {
//   // console.log(req.body);
//   // res.send("Form data received");
//   const {
//     startTime,
//     endTime,
//     purpose,
//     organizingDept,
//     contactEmail,
//     contactMobile,
//   } = req.body;

//   const sql =
//     "INSERT INTO users (startTime,endTime,purpose,organizingDept,contactEmail,contactMobile) VALUES (?, ?, ?, ?, ?, ?)";
//   console.log(req.body);
//   db.query(
//     sql,
//     [startTime, endTime, purpose, organizingDept, contactEmail, contactMobile],
//     (err, result) => {
//       if (err) {
//         console.log(err);
//         return res.send("Error inserting data");
//       } else {
//         res.send("User added successfully");
//       }
//     },
//   );
// });
