var express = require("express");
var router = express.Router();

/* GET home page. */
const pokemonRouter = require("./pokemon.api.js");

router.use("/pokemons", pokemonRouter);

router.get("/", function (req, res, next) {
  res.status(200).send("Welcome to Pokemon World");
});

module.exports = router;
