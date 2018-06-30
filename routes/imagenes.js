var express = require('express');
var fs = require('fs');
var path = require('path');

var app = express();

app.get('/:tipo/:img', (req, res, next) => {
  var tipo = req.params.tipo;
  var img = req.params.img;

  file = path.join(__dirname, '../uploads', tipo, img);

  fs.exists(file, existe => {
    if (!existe) {
      file = path.join(__dirname, '../assets', 'no-img.jpg');
    }
    res.sendFile(file);
  });
});

function deleteImage(tipo, img) {
  file = path.join(__dirname, '../uploads', tipo, img);
  // Eliminar la imagen asociada del hospital
  if (fs.existsSync(file)) {
    fs.unlink(file, _ => {});
  }
}

module.exports = app;
module.exports.deleteImage = deleteImage;
