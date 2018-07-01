// Requires
var express = require('express');
const { deleteImage } = require('./imagenes');

// Inicializar variables
var app = express();
var mdAutenticacion = require('../middlewares/auth.middleware');

var Hospital = require('../models/hospital');

//=====================================
// Obtener todos los hospitales
//=====================================
app.get('/', (req, res) => {
  var desde = req.query.desde || 0;
  desde = Number(desde);

  Hospital.find({}, 'nombre img usuario')
    .populate('usuario', 'nombre email')
    .skip(desde)
    .limit(5)
    .exec((err, hospitales) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Get hospitales!',
          error: err
        });
      }

      Hospital.count({}, (_, count) => {
        res.status(200).json({
          ok: true,
          hospitales: hospitales,
          total: count
        });
      });
    });
});

//=====================================
// Cargar hospital
//=====================================
app.get('/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;

  Hospital.findById(id)
    .populate('usuario', 'nombre img email')
    .exec((err, hospital) => {
      if (err) {
        return res.status(500).json({
          mensaje: 'Error cargando hospital',
          errors: err
        });
      }

      if (!hospital) {
        return res.status(400).json({
          mensaje: `No existe un hospital con el ID: ${id}`,
          errors: 'No existe un hospital con ese ID'
        });
      }

      res.status(200).json(hospital);
    });
});

//=====================================
// Crear un hospital
//=====================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
  var body = req.body;

  var hospital = new Hospital({
    nombre: body.nombre,
    usuario: req.usuario._id
  });

  hospital.save((err, hospital) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error cargando hospital',
        errors: err
      });
    }

    res.status(201).json({
      ok: true,
      hospital: hospital
    });
  });
});

//=====================================
// Actualizar un hospital
//=====================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  var body = req.body;

  Hospital.findById(id, (err, hospital) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar hospital',
        errors: err
      });
    }

    if (!hospital) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El hospital con el id ' + id + 'no existe',
        errors: { message: 'No existe un hospital con ese ID' }
      });
    }

    hospital.nombre = body.nombre;
    hospital.usuario = req.usuario._id;

    hospital.save((err, hospital) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar el hospital',
          errors: err
        });
      }

      res.status(200).json({
        ok: true,
        hospital: hospital
      });
    });
  });
});

//=====================================
// Borra un hospital por el id
//=====================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;

  Hospital.findByIdAndRemove(id, (err, hospital) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al borrar el hospital',
        errors: err
      });
    }

    if (!hospital) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No existe un hospital con el ID ' + id,
        errors: { message: 'No existe un hospital con el ID ' + id }
      });
    }

    deleteImage('hospitales', hospital.img);

    res.status(200).json({
      ok: true,
      hospital: hospital
    });
  });
});

module.exports = app;
