const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  addHealthLog,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/add-health-log", addHealthLog);

module.exports = router;
