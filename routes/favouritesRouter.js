const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');

const Favourites = require('../models/favourites');
const cors = require('./cors');

const favouritesRouter = express.Router();

favouritesRouter.use(bodyParser.json());

favouritesRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favourites.find({})
        .populate('user')
        .populate('dishes')
        .then((fav) => {
            // extract the fav dishes that matches req.user.id(user id)
            if (fav.length) {
                user_fav = fav.find(f => f.user._id.toString() === req.user.id.toString());
                if(!user_fav) {
                    var err = new Error('You have no favourites!');
                    err.status = 404;
                    return next(err);
                }
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(user_fav);
            } else {
                var err = new Error("There are no favourites");
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser,
    (req, res, next) => {
        Favourites.find({})
            .populate('user')
            .populate('dishes')
            .then((fav) => {
                var selectedFav;
                if (fav) 
                    selectedFav = fav.find(f => f.user._id.toString() === req.user.id.toString());
                if(!selectedFav) 
                    selectedFav = new Favourites({user: req.user.id});
                for(let i of req.body) {
                    if (selectedFav.dishes.find((d_id) => {
                        if (d_id._id) {
                            return d_id._id.toString() === i._id.toString();
                        }
                    }))
                        continue;
                    selectedFav.dishes.push(i._id);
                }
                selectedFav.save()
                    .then((userFavs) => {
                        res.statusCode = 201;
                        res.setHeader("Content-Type", "application/json");
                        res.json(userFavs);
                        console.log("Favourites Added")
                    }, (err) => next(err))
                    .catch((err) => next(err));
            })
            .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favourites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.find({})
        .populate('user')
        .populate('dishes')
        .then((fav) => {
            var favToRemove;
            if (fav) {
                favToRemove = fav.find(fav => fav.user._id.toString() === req.user.id.toString());
            }
            if (favToRemove) {
                favToRemove.remove()
                    .then((result) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(result);
                    }, (err) => next(err));
            }
            else {
                var err = new Error('You do not have any favourites');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});

favouritesRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res, next) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favourites.find({})
        .populate('user')
        .populate('dishes')
        .then((fav) => {
            if (fav) {
                const favs = fav.find((f => f.user._id.toString() === req.user.id.toString()));
                const dish = favs.dishes.find(d => d.id === req.params.dishId);
                if (dish) {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(dish);
                } else {
                    var err = new Error('You do not have dish' + req.params.dishId);
                    err.status = 404;
                    return next(err);
                }
            } else {
                var err = new Error('You do not have any favourites');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
    (req, res, next) => {
        Favourites.find({})
            .populate('user')
            .populate('dishes')
            .then((favourites) => {
                var user;
                if(favourites)
                    user = favourites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
                if(!user) 
                    user = new Favourites({user: req.user.id});
                if(!user.dishes.find((d_id) => {
                    if(d_id._id)
                        return d_id._id.toString() === req.params.dishId.toString();
                }))
                    user.dishes.push(req.params.dishId);
                
                user.save()
                    .then((userFavs) => {
                        res.statusCode = 201;
                        res.setHeader("Content-Type", "application/json");
                        res.json(userFavs);
                        console.log("Favourites Created");
                    }, (err) => next(err))
                    .catch((err) => next(err));

            })
            .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favourites/:dishId');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.find({})
        .populate('user')
        .populate('dishes')
        .then((fav) => {
            var user;
            if (fav)
                user = fav.find(f => f.user._id.toString() === req.user.id.toString());
            if (user) {
                user.dishes = user.dishes.filter((d) => d._id.toString() !== req.params.dishId);
                user.save()
                    .then((result) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.join(result);
                    })
            } else {
                var err = new Error('You do not have any favourites');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});

module.exports = favouritesRouter;