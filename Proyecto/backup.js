const express = require('express');
const bodyParser = require('body-parser');
const request = require("request-promise");
const getJSON = require('get-json')
const app = express();
const fs = require('fs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());




//Enpoint para mostrar datos de la tienda
app.get('/Restaurar', function (req, res) {
     fs.readFile('archivo.json', (err, data) => {
          if (err) throw err;
          let RestaurarEstado = JSON.parse(data);
          console.log(RestaurarEstado);
     }).catch((function (err) {
          console.log("no se restauro nada")
     }))
     res.send(RestaurarEstado);
});



// Endpoint salvar estado de la tienda
app.post('/Backup', function (req, res) {

     var backup = req.body;
     fs.writeFile('archivo.json', JSON.stringify(backup), 'utf8', (err) => {
          if (err) throw err;
          console.log('The file has been saved!');
          res.send({ status: 1 });
     });
})





app.listen(4000, () => {
     console.log('Escuchando peticiones en el puerto 4000');
});