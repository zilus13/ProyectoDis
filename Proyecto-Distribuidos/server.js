const express = require('express');
const bodyParser = require('body-parser');
const request = require("request-promise");
const getJSON = require('get-json')
const app = express();
const fs = require('fs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



var datos_tienda = {
     nombre: 'Tienda1',
     ip: '192.168.56.1',
     productos: [{
          id: 1,
          nombre: 'Hamburguesa',
          cantidad: 100,
          precio: 10,
     },
     {
          id: 1,
          nombre: 'perro caliente',
          cantidad: 13,
          precio: 10,
     }]
};

var tiendas_conectadas = [{
     tienda_ip: '192.168.56.1',
     nombre_tienda: 'Tienda1',
     puerto: '3000'
},
{
     tienda_ip: '192.168.0.15',
     nombre_tienda: 'Tienda3',
     puerto: '3000'
}];
var clientes_compra = [];

function guardar() {
     request.post('http://localhost:4000/Backup', {
          json: {
               datos_tienda,
               tiendas_conectadas,
               clientes_compra
          }
     }, (error, res, body) => {
          if (error) {
               console.error(error)
               return
          }
          console.log(`statusCode: ${res.statusCode}`)
          console.log(body)
     })
}

//Enpoint para mostrar datos de la tienda
app.get('/Mostrar_Tienda', function (req, res) {
     res.send(datos_tienda);
});

//Enpoint para mostrar registro de compras
app.get('/Mostrar_Compras', function (req, res) {
     res.send(clientes_compra);
});

// Endpoint para Modificar productos
app.post('/Modificar-Productos', function (req, res) {

     var monto = req.body.monto;
     var producto = req.body.producto;

     for (let index = 0; index < datos_tienda.productos.length; index++) {
          console.log(datos_tienda.productos[index].nombre.localeCompare(producto));
          if (datos_tienda.productos[index].nombre == producto) {
               datos_tienda.productos[index].precio = monto;
          }
     }
     guardar()
     res.send(datos_tienda);
})

//Endpoint para Agregar productos
app.post('/Agregar-productos', async (req, res) => {

     let producto = req.body;
     datos_tienda.productos.push(producto);
     guardar()
     res.send(datos_tienda);
});
//Endpoint para Agregar compra por cliente 
app.post('/compra', function (req, res) {

     let compra = req.body;
     let producto_comprado = compra.nombre_produto;
     let cantidad_comprada = compra.cantidad;

     for (let index = 0; index < datos_tienda.productos.length; index++) {
          if (datos_tienda.productos[index].nombre == producto_comprado) {
               if ((datos_tienda.productos[index].cantidad - cantidad_comprada) >= 0) {
                    datos_tienda.productos[index].cantidad = datos_tienda.productos[index].cantidad - cantidad_comprada;
               }

          }

     }
     clientes_compra.push(compra);
     guardar()
     res.send(datos_tienda);
})

//Endpoint para Eliminar productos
app.post('/Eliminar-Producto', (req, res) => {

     let producto_eliminar = req.body.nombre;
     for (let index = 0; index < datos_tienda.productos.length; index++) {
          if (datos_tienda.productos[index].nombre == producto_eliminar) {

               datos_tienda.productos.splice(index, 1);

          }
     }
     guardar()
     res.send(datos_tienda);

});

//Endpoint para Agregar tiendas
app.post('/Agregar-Tiendas', function (req, res) {

     let tienda = req.body;

     tiendas_conectadas.push(tienda);
     res.send(tiendas_conectadas);
     guardar()
});

//Endpoint para eliminar tiendas
app.post('/eliminar-Tiendas-no-conectadas', function (req, res) {

     let tienda_eliminar = req.body.ip;

     console.log('tienda a eliminar:' + tienda_eliminar);

     for (let index = 0; index < tiendas_conectadas.length; index++) {

          if (tiendas_conectadas[index].tienda_ip == tienda_eliminar && tienda_eliminar != undefined) {

               tiendas_conectadas.splice(index, 1);

          }
     }
     guardar()
     res.send(tiendas_conectadas);
});

//Endpoint para verificar si tienda esta Disponible
app.get('/confirmar-conexion', function (req, res) {

     let verificar = {
          status: true
     };
     guardar()
     res.send(verificar);
});

//Endpoint para verificar si tienda esta Disponible sino elimina
app.get('/confirmar-conexion-tiendas', async (req, res) => {
     var respuestas = [];

     for (let index = 0; index < tiendas_conectadas.length; index++) {

          let ip = tiendas_conectadas[index].tienda_ip;
          let puerto = tiendas_conectadas[index].puerto;

          let peticion = {
               uri: 'http://' + ip + ':' + puerto + '/confirmar-conexion'
          };

          await request(peticion).then(() => {

               respuestas.push({ status: true });

          }).catch(function (err) {
               respuestas.push({ status: false });
               console.log('respuesta::: ' + JSON.stringify(respuestas));
          })
          console.log("ip::" + ip);
     }

     var bandera = 0;
     var condicion = respuestas.length;
     while (bandera < condicion) {

          if (respuestas[bandera].status == false) {
               tiendas_conectadas.splice(bandera, 1);
               respuestas.splice(bandera, 1);
               bandera = 0;
               condicion = respuestas.length;
               console.log("index::" + bandera);
               console.log('vector::: ' + JSON.stringify(tiendas_conectadas[bandera]));
          }
          bandera++;
     }

     guardar()
     res.send(tiendas_conectadas);
});

//Endpoint para sumar monto  total de tienda
app.get('/Total-tienda', function (req, res) {
     var total_local = 0;
     //calculo total de producto locales
     for (let index = 0; index < datos_tienda.productos.length; index++) {
          total_local = total_local + datos_tienda.productos[index].precio;
     }

     res.send({ total_local });

});

//Endpoint para sumar monto  total de tienda
app.get('/Total-tiendas', async (req, res) => {

     var total = 0;
     let peticion = {
          uri: 'http://localhost:3000/confirmar-conexion-tiendas'
     };

     await request(peticion).then((response) => {

          console.log('respuesta :: ', response);

     }).catch(function (err) {
          console.log('respuesta de error :: ', err);
     });

     var suma = 0;
     for (let index = 0; index < tiendas_conectadas.length; index++) {

          let ip = tiendas_conectadas[index].tienda_ip;
          let puerto = tiendas_conectadas[index].puerto;

          let peticion = {
               uri: 'http://' + ip + ':' + puerto + '/Total-tienda'
          };

          await request(peticion).then((response) => {


               var momo = JSON.parse(response);
               console.log("momo::" + momo.total_local)
               suma = suma + momo.total_local;

          }).catch(function (err) {
               console.log('respuesta de error::: ', err);
          })
     }
     guardar()
     res.send({ total_tiendas: suma });

});



app.listen(3000, () => {
     console.log('Escuchando peticiones en el puerto 3000');
});