const express = require("express");
const { db } = require("../../config/db");

const router = express.Router();
console.log("Booking router loaded");

router.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.send("Booking route working");
});
router.post("/", (req, res) => {
  console.log("API HIT");
  console.log("Booking router loaded");
  console.log("Request body:", req.body);
  const {
    startTime,
    endTime,
    purpose,
    organizingDept,
    contactEmail,
    contactMobile,
  } = req.body;

  const sql =
    "INSERT INTO users (startTime,endTime,purpose,organizingDept,contactEmail,contactMobile) VALUES (?, ?, ?, ?, ?, ?)";

  const values = [
    startTime,
    endTime,
    purpose,
    organizingDept,
    contactEmail,
    contactMobile,
  ];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Error inserting data");
    }
    console.log("Insert Result:", result);
    res.json({
      message: "User added successfully",
      id: result.insertId,
    });
  });
});

module.exports = router;
