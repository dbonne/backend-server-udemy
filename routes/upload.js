var express = require('express');
const uuidv4 = require('uuid/v4');

var fileUpload = require('express-fileupload');
var fs = require('fs');

var app = express();

var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// default options
app.use(fileUpload());

app.put('/:tipo/:id', (req, res, next) => {
  var tipo = req.params.tipo;
  var id = req.params.id;

  // tipos de colección
  var tiposValidos = ['hospitales', 'medicos', 'usuarios'];
  if (tiposValidos.indexOf(tipo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Tipo de colección no es válida',
      errors: { message: 'Tipo de colección no es válida' }
    });
  }

  if (!req.files) {
    return res.status(400).json({
      ok: false,
      mensaje: 'No selecciono nada',
      errors: { message: 'Debe de seleccionar una imagen' }
    });
  }

  // Obtener nombre del archivo
  var archivo = req.files.imagen;
  var nombreCortado = archivo.name.split('.');
  var extensionArchivo = nombreCortado[nombreCortado.length - 1];

  // Sólo estas extensiones aceptamos
  var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

  if (extensionesValidas.indexOf(extensionArchivo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Extension no válida',
      errors: {
        message: 'Las extensiones válidas son ' + extensionesValidas.join(', ')
      }
    });
  }

  // Nombre de archivo personalizado
  // 12312312312-123.png
  var nombreArchivo = `${uuidv4()}.${extensionArchivo}`;

  // Mover el archivo del temporal a un path
  var path = `./uploads/${tipo}/${nombreArchivo}`;

  archivo.mv(path, err => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al mover archivo',
        errors: err
      });
    }

    subirPorTipo(tipo, id, nombreArchivo, res);
  });
});

function subirPorTipo(tipo, id, nombreArchivo, res) {
  if (tipo === 'usuarios') {
    Usuario.findById(id, (_, usuario) => {
      if (!usuario) {
        return res.status(400).json({
          ok: true,
          mensaje: 'Usuario no existe',
          errors: { message: 'Usuario no existe' }
        });
      }

      var pathViejo = `./uploads/usuarios/${usuario.img}`;

      // Si existe, elimina la imagen anterior
      if (fs.existsSync(pathViejo)) {
        fs.unlink(pathViejo, _ => {});
      }

      usuario.img = nombreArchivo;

      usuario.save((_, usuario) => {
        usuario.password = ':)';

        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de usuario actualizada',
          usuario: usuario
        });
      });
    });
  }

  if (tipo === 'medicos') {
    Medico.findById(id, (_, medico) => {
      if (!medico) {
        return res.status(400).json({
          ok: true,
          mensaje: 'Médico no existe',
          errors: { message: 'Médico no existe' }
        });
      }

      var pathViejo = `./uploads/medicos/${medico.img}`;

      // Si existe, elimina la imagen anterior
      if (fs.existsSync(pathViejo)) {
        fs.unlink(pathViejo, _ => {});
      }

      medico.img = nombreArchivo;

      medico.save((_, medico) => {
        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de médico actualizada',
          medico: medico
        });
      });
    });
  }

  if (tipo === 'hospitales') {
    Hospital.findById(id, (_, hospital) => {
      if (!hospital) {
        return res.status(400).json({
          ok: true,
          mensaje: 'Hospital no existe',
          errors: { message: 'Hospital no existe' }
        });
      }

      var pathViejo = `./uploads/hospitales/${hospital.img}`;

      // Si existe, elimina la imagen anterior
      if (fs.existsSync(pathViejo)) {
        fs.unlink(pathViejo, _ => {});
      }

      hospital.img = nombreArchivo;

      hospital.save((_, hospital) => {
        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de hospital actualizada',
          hospital: hospital
        });
      });
    });
  }
}

module.exports = app;
