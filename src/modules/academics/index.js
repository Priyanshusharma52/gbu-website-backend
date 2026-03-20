const express = require("express");
const { db } = require("../../config/db");

const router = express.Router();
console.log("Academic router loaded");

router.get("/", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.send("Academic route working");
});
// router.get("/schools", (req, res) => {
//   const query = "SELECT * FROM schools";

//   db.query(query, (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ error: "Database error" });
//     }

//     res.json(result);
//   });
// });
router.get("/schools", (req, res) => {
  const query = "SELECT * FROM schools";

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Database error" });
    }

    // JSON parse
    const schools = result.map((school) => ({
      ...school,
      features: JSON.parse(school.features),
    }));

    res.json(schools);
  });
});
module.exports = router;
module.exports = router;
