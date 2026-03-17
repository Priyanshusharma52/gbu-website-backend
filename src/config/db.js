const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "test",
});

const connectDb = async () => {
  db.connect((err) => {
    if (err) {
      console.log(
        "DB............,,,,,,,,,.....>>>>>><,,,,, connection error",
        err,
      );
    } else {
      console.log("MySQL    ........... Connected");
    }
  });
};

module.exports = {
  db,
  connectDb,
};
