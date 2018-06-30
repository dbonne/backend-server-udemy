// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
const { deleteImage } = require('./imagenes');

// Inicializar variables
var app = express();
var mdAutenticacion = require('../middlewares/auth.middleware');

var Medico = require('../models/medico');

//=====================================
// Obtener todos los médicos
//=====================================
app.get('/', (req, res) => {
  var desde = req.query.desde || 0;
  desde = Number(desde);

  Medico.find({}, 'nombre img usuario hospital')
    .populate('usuario', 'nombre email')
    .populate('hospital')
    .skip(desde)
    .limit(5)
    .exec((err, medicos) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Get medicos!',
          error: err
        });
      }

      Medico.count({}, (_, count) => {
        res.status(200).json({ ok: true, medicos: medicos, total: count });
      });
    });
});

//=====================================
// Crear un médico
//=====================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
  var body = req.body;
  var medico = new Medico({
    nombre: body.nombre,
    usuario: req.usuario._id,
    hospital: body.hospital
  });

  medico.save((err, medico) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error cargando medico',
        errors: err
      });
    }

    res.status(201).json({
      ok: true,
      medico: medico
    });
  });
});

//=====================================
// Actualizar un medico
//=====================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  var body = req.body;

  Medico.findById(id, (err, medico) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar medico',
        errors: err
      });
    }

    if (!medico) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El medico con el id ' + id + 'no existe',
        errors: { message: 'No existe un medico con ese ID' }
      });
    }

    medico.nombre = body.nombre;
    medico.usuario = req.usuario._id;
    medico.hospital = body.hospital;

    medico.save((err, medico) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar el medico',
          errors: err
        });
      }

      res.status(200).json({
        ok: true,
        medico: medico
      });
    });
  });
});

//=====================================
// Borra un medico por el id
//=====================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;

  Medico.findByIdAndRemove(id, (err, medico) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al borrar el medico',
        errors: err
      });
    }

    if (!medico) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No existe un medico con el ID ' + id,
        errors: { message: 'No existe un medico con el ID ' + id }
      });
    }

    deleteImage('medicos', medico.img);

    res.status(200).json({
      ok: true,
      medico: medico
    });
  });
});

module.exports = app;
