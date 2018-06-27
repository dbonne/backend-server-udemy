// Requires
var express = require('express');

// Inicializar variables
var app = express();

var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');

// ==============================
// Busqueda por colección
// ==============================
app.get('/coleccion/:collection/:busqueda', (req, res) => {
  var busqueda = req.params.busqueda;
  var collection = req.params.collection;
  var regex = new RegExp(busqueda, 'i');

  var promise;

  switch (collection) {
    case 'usuarios':
      promise = buscarUsuarios(regex);
      break;

    case 'medicos':
      promise = buscarMedicos(regex);
      break;

    case 'hospitales':
      promise = buscarHospitales(regex);
      break;

    default:
      return res.status(400).json({
        ok: false,
        mensaje: 'Los tipos de busqueda sólo son: usuarios, medicos y hospitales',
        error: { message: 'Tipo de tabla/coleccion no válido' }
      });
  }

  promise.then(data => {
    res.status(200).json({
      ok: true,
      [collection]: data
    });
  });
});

// ==============================
// Busqueda por general
// ==============================
app.get('/todo/:busqueda', (req, res) => {
  var busqueda = req.params.busqueda;
  var regex = new RegExp(busqueda, 'i');

  Promise.all([
    buscarHospitales(regex),
    buscarMedicos(regex),
    buscarUsuarios(regex)
  ]).then(responses => {
    res.status(200).json({
      ok: true,
      hospitales: responses[0],
      medicos: responses[1],
      usuarios: responses[2]
    });
  });
});

function buscarHospitales(regex) {
  return new Promise((resolve, reject) => {
    Hospital.find({ nombre: regex })
      .populate('usuario', 'nombre email')
      .exec((err, hospitales) => {
        if (err) {
          reject('Error al cargar hospitales', err);
        } else {
          resolve(hospitales);
        }
      });
  });
}

function buscarMedicos(regex) {
  return new Promise((resolve, reject) => {
    Medico.find({ nombre: regex })
      .populate('usuario', 'nombre email')
      .populate('hospital')
      .exec((err, medicos) => {
        if (err) {
          reject('Error al cargar medicos', err);
        } else {
          resolve(medicos);
        }
      });
  });
}

function buscarUsuarios(regex) {
  return new Promise((resolve, reject) => {
    Usuario.find({}, 'nombre email role')
      .or([{ nombre: regex, email: regex }])
      .exec((err, usuarios) => {
        if (err) {
          reject('Error al cargar los usuarios', err);
        } else {
          resolve(usuarios);
        }
      });
  });
}

module.exports = app;
