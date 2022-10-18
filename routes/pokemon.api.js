const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const router = express.Router();

/**
 descrpitions: get all pokemons
*/

router.get("/pokemons", function (req, res, next) {
  const allowedFilter = ["search", "type", "page", "limit"];
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    let { data } = db;

    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    let offset = limit * (page - 1);

    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      //remove malicious query
      if (!filterQuery[key]) delete filterQuery[key];
      if (key === "search" || key === "type") {
        data = data.filter((item) => item.name.includes(filterQuery[key]));
      }
    });
    data = data.slice(offset, offset + limit);

    res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
});

/**
 descrpitions: get single pokemon
*/

router.get("/pokemons/:pokeId", function (req, res, next) {
  const { pokeId } = req.params;
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    let { data } = db;

    if (pokeId === "1") {
      console.log(data[0]);
      data = [data.slice(-1)[0], data[0], data[1]];
    } else {
      data = data.filter(
        (item) =>
          item.id === Number(pokeId) ||
          item.id + 1 === Number(pokeId) ||
          item.id - 1 === Number(pokeId)
      );
    }
    res.status(200).send({ data });
  } catch (error) {
    next(error);
  }
});

/**
 descrpitions: post pokemon
*/

router.post("/pokemons", function (req, res, next) {
  const pokemonTypes = [
    "bug",
    "dragon",
    "fairy",
    "fire",
    "ghost",
    "ground",
    "normal",
    "psychic",
    "steel",
    "dark",
    "electric",
    "fighting",
    "flyingText",
    "grass",
    "ice",
    "poison",
    "rock",
    "water",
  ];

  let { name, id, types, url } = req.body;
  let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
  let { data } = db;
  try {
    //Validate Inputs & Handle Errors

    if (!name || !id) {
      const exception = new Error(`Missing required data.`);
      exception.statusCode = 401;
      throw exception;
    }

    if (types.length > 2) {
      const exception = new Error(`Pokémon can only have one or two types.`);
      throw exception;
    }

    types.forEach((type) => {
      if (pokemonTypes.includes(type)) {
        return type;
      } else {
        const exception = new Error(`Pokémon’s type is invalid.`);
        throw exception;
      }
    });
    data.map((item) => {
      if (item.name === name || item.id === id) {
        const exception = new Error(`The Pokémon already exists.`);
        throw exception;
      } else {
        return item;
      }
    });

    //Create & Save Pokemon
    const newPokemon = { name: name, id: id, url: url, types: types };
    data.push(newPokemon);

    fs.writeFileSync("db.json", JSON.stringify(db));
    res.status(200).send("done");
  } catch (error) {
    next(error);
  }
});

/**
 descrpitions: update pokemon
*/

router.put("/pokemons", function (req, res, next) {
  const updates = req.body;
  const allowUpdate = ["name", "types", "url"];
  const pokemonTypes = [
    "bug",
    "dragon",
    "fairy",
    "fire",
    "ghost",
    "ground",
    "normal",
    "psychic",
    "steel",
    "dark",
    "electric",
    "fighting",
    "flyingText",
    "grass",
    "ice",
    "poison",
    "rock",
    "water",
  ];

  try {
    //Input Validation

    //fields:
    const updateKeys = Object.keys(updates);
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));
    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    //types:
    if (updates.types) {
      types = types.split();
      if (types.length > 2) {
        const exception = new Error(`Pokémon can only have one or two types.`);
        throw exception;
      }
      types.forEach((type) => {
        if (pokemonTypes.includes(type)) {
          return type;
        } else {
          const exception = new Error(`Pokémon’s type is invalid.`);
          throw exception;
        }
      });
    }

    //Processing data
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    let { data } = db;

    const targetIndex = data.findIndex((item) => item.id === Number(pokeId));

    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      throw exception;
    }

    const updatedPokemon = { ...data[targetIndex], ...updates };
    data[targetIndex] = updatedPokemon;

    //Save data
    fs.writeFileSync("db.json", JSON.stringify(db));
    res.status(200).send({ data: updatedPokemon });
  } catch (error) {
    next(error);
  }
});

/**
 descrpitions: delete pokemon by id
*/

router.delete("/pokemons/:pokeId", function (req, res, next) {
  const { pokeId } = req.params;
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    let { data } = db;

    //Input Validation
    const targetIndex = data.findIndex((item) => item.id === pokeId);
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    //Process & Save Data
    data.filter((item) => item.id !== pokeId);
    fs.writeFileSync(("db.json", JSON.stringify(db)));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
