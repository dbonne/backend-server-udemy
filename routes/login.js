var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const { SEED, GOOGLE_CLIENT_ID } = require('../config/config');

// Google
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

var app = express();
var Usuario = require('../models/usuario');

//=====================================
// Autenticación Google
//=====================================
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: GOOGLE_CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();

  return {
    nombre: payload.name,
    email: payload.email,
    img: payload.picture,
    google: true
  };
}

app.post('/google', async (req, res) => {
  var token = req.body.token;
  var googleUser = await verify(token).catch(e => {
    return res.status(403).json({
      ok: false,
      mensaje: 'Token no válido'
    });
  });

  Usuario.findOne({ email: googleUser.email }, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: true,
        mensaje: 'Error al buscar usuario - login',
        errors: err
      });
    }

    if (usuario) {
      if (usuario.google === false) {
        return res.status(400).json({
          ok: true,
          mensaje: 'Debe de usar su autenticación local'
        });
      } else {
        usuario.password = ':)';

        generateAuthToken(usuario, res);
      }
    } else {
      // Si el usuario no existe por correo
      usuario = new Usuario({
        nombre: googleUser.nombre,
        email: googleUser.email,
        img: googleUser.img,
        password: ':)',
        google: true
      });

      usuario.save((err, usuario) => {
        if (err) {
          return res.status(500).json({
            ok: true,
            mensaje: 'Error al crear usuario - google',
            errors: err
          });
        }

        generateAuthToken(usuario, res);
      });
    }
  });
});

//=====================================
// Autenticación local
//=====================================

app.post('/', (req, res) => {
  var body = req.body;

  Usuario.findOne({ email: body.email }, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - email',
        errors: err
      });
    }

    if (!bcrypt.compareSync(body.password, usuario.password)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - password',
        errors: err
      });
    }

    // Crear un token!!!
    usuario.password = ':)';

    generateAuthToken(usuario, res);
  });
});

function generateAuthToken(usuario, res) {
  var token = jwt.sign({ usuario: usuario }, SEED, { expiresIn: 14400 }); // 4 horas
  res.status(200).json({
    ok: true,
    usuario,
    token: token,
    id: usuario._id
  });
}

module.exports = app;
