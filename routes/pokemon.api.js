const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const router = express.Router();

/**
 descrpitions: get all pokemons
*/

router.get("/", function (req, res, next) {
  const allowedFilter = ["search", "type", "page", "limit"];
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    let { data } = db;

    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
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
    });

    let datas = [];
    if (filterKeys.length) {
      if (filterKeys.includes("search")) {
        datas = datas.length
          ? datas.filter((pokemon) =>
              pokemon.name.includes(filterQuery.search.toLowerCase())
            )
          : data.filter((pokemon) =>
              pokemon.name.includes(filterQuery.search.toLowerCase())
            );
      }
      //filter by types
      if (filterKeys.includes("type")) {
        datas = datas.length
          ? datas.filter((pokemon) =>
              pokemon.types.some(
                (el) => el.toLowerCase() === filterQuery.type.toLowerCase() // case insensitive search
              )
            )
          : data.filter((pokemon) =>
              pokemon.types.some(
                (el) => el.toLowerCase() === filterQuery.type.toLowerCase()
              )
            );
      }
    } else {
      datas = data;
    }

    datas = datas.slice(offset, offset + limit);

    res.status(200).send({ datas });
  } catch (error) {
    next(error);
  }
});

/**
 descrpitions: get single pokemon
*/

router.get("/:pokeId", function (req, res, next) {
  const { pokeId } = req.params;
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    let { data, totalPokemons } = db;

    let index = data.indexOf(
      data.find((pokemon) => pokemon.id === parseInt(pokeId))
    );

    let datas;

    switch (index) {
      case 0:
        datas = {
          pokemon: data[0],
          previousPokemon: data[totalPokemons - 1],
          nextPokemon: data[1],
        };
        break;
      case totalPokemons - 1:
        datas = {
          pokemon: data[totalPokemons - 1],
          previousPokemon: data[totalPokemons - 2],
          nextPokemon: data[0],
        };
        break;
      default:
        datas = {
          pokemon: data[index],
          previousPokemon: data[index - 1],
          nextPokemon: data[index + 1],
        };
    }
    res.status(200).send({ datas });
  } catch (error) {
    next(error);
  }
});

/**
 descrpitions: post pokemon
*/

router.post("/", function (req, res, next) {
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

router.put("/:pokeId", function (req, res, next) {
  const { pokeId } = req.params;
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

router.delete("/:pokeId", function (req, res, next) {
  const { pokeId } = req.params;
  //   console.log(req.params);
  try {
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    let { data } = db;
    console.log(data);

    //Input Validation
    const targetIndex = data.findIndex((item) => item.id === parseInt(pokeId));
    // console.log(foundPokemon);
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    //Process & Save Data
    db.data = data.filter((item) => item.id !== parseInt(pokeId));
    fs.writeFileSync("db.json", JSON.stringify(db));
    res.status(200).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
