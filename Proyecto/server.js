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
     productos: ['a', 'b', 'c', 'a'],
     precio: [200, 100, 300, 200],
     cantidad: [10, 20, 30, 15],
     //clientes: ['lui'],
     //producto ,cantidad , precio total
     compras: {
          clientes: ['lui'],
          productos: ['a'],
          precio: [200],
          cantidad: [1],
          total: [200]

     }
};

var tiendas_conectadas = [{
     tienda_ip: '192.168.0.108',
     nombre_tienda: 'Tienda1',
     puerto: '3500'
},
{
     tienda_ip: '193.168.0.15',
     nombre_tienda: 'Tienda3',
     puerto: '3000'
}];
function guardar() {
     request.post('http://localhost:4000/Backup', {
          json: {
               datos_tienda,
               tiendas_conectadas,
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
app.get('/restauro', async (req, res) => {
     let peticion = {
          uri: 'http://localhost:4000/Restaurar'
     };
     await request(peticion).then((response) => {

          console.log('respuesta :: ', response);

     }).catch(function (err) {
          console.log('respuesta de error :: ', err);
     });
     res.send('ok');
});

//Enpoint para mostrar datos de la tienda
app.get('/Mostrar_Tienda', function (req, res) {
     guardar()
     res.send(datos_tienda);
});
//Enpoint para mostrar tiendas
app.get('/Mostrar_Tienda_conectadas', function (req, res) {
     res.send(tiendas_conectadas);
});

// //Enpoint para mostrar registro de compras
app.get('/Mostrar_Compras', function (req, res) {
     res.send(datos_tienda.compras);
});
// //Enpoint para mostrar registro de compras
app.get('/productos', function (req, res) {
     let producto = datos_tienda.productos;
     let cantidad = datos_tienda.cantidad;
     let precio = datos_tienda.precio;

     res.send({ producto, cantidad, precio });
});


// // Endpoint para Modificar productos
app.post('/Modificar-Productos', function (req, res) {

     var monto = req.body.monto;
     var producto = req.body.producto;
     var cantidad = req.body.cantidad;

     console.log(datos_tienda.productos.length)
     for (let index = 0; index < datos_tienda.productos.length; index++) {

          if (datos_tienda.productos[index] == producto) {
               datos_tienda.precio[index] = monto;
               datos_tienda.cantidad[index] = cantidad;
          }
     }

     res.send(datos_tienda);
})

// //Endpoint para Agregar productos
app.post('/Agregar-productos', async (req, res) => {

     let producto = req.body.producto;
     let cantidad = req.body.cantidad;
     let monto = req.body.monto;

     datos_tienda.productos.push(producto);
     datos_tienda.cantidad.push(cantidad);
     datos_tienda.precio.push(monto);

     res.send(datos_tienda);
});

// //Endpoint para Agregar compra por cliente 
app.post('/compra', function (req, res) {

     let cliente = req.body.cliente;
     let producto = req.body.producto;
     let cantidad = req.body.cantidad;


     for (let index = 0; index < datos_tienda.productos.length; index++) {
          if (datos_tienda.productos[index] == producto) {
               if ((datos_tienda.cantidad[index] - cantidad) >= 0) {
                    datos_tienda.cantidad[index] = datos_tienda.cantidad[index] - cantidad;
                    datos_tienda.compras.clientes.push(cliente);
                    datos_tienda.compras.productos.push(producto);
                    datos_tienda.compras.cantidad.push(cantidad);
                    datos_tienda.compras.precio.push(datos_tienda.precio[index])
                    datos_tienda.compras.total.push(cantidad * datos_tienda.precio[index]);
               }
          }
     }
     res.send(datos_tienda);
})

// //Endpoint para Eliminar productos
app.post('/Eliminar-Producto', (req, res) => {

     let producto_eliminar = req.body.nombre;
     for (let index = 0; index < datos_tienda.productos.length; index++) {
          if (datos_tienda.productos[index] == producto_eliminar) {
               datos_tienda.productos.splice(index, 1);
               datos_tienda.cantidad.splice(index, 1);
               datos_tienda.precio.splice(index, 1);
          }
     }
     res.send(datos_tienda);
});

// //Endpoint para Agregar tiendas
app.post('/Agregar-Tiendas', function (req, res) {

     let tienda = req.body;
     tiendas_conectadas.push(tienda);
     res.send(tiendas_conectadas);
});

// //Endpoint para eliminar tiendas
app.post('/eliminar-Tiendas-no-conectadas', function (req, res) {

     let tienda_eliminar = req.body.ip;
     console.log('tienda a eliminar:' + tienda_eliminar);

     for (let index = 0; index < tiendas_conectadas.length; index++) {

          if (tiendas_conectadas[index].tienda_ip == tienda_eliminar && tienda_eliminar != undefined) {

               tiendas_conectadas.splice(index, 1);

          }
     }
     res.send(tiendas_conectadas);
});

// //Endpoint para verificar si tienda esta Disponible
app.get('/confirmar-conexion', function (req, res) {

     let verificar = {
          status: true
     };

     res.send(verificar);
});

// //Endpoint para verificar si tienda esta Disponible sino elimina
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

     for (let index = 0; index < respuestas.length; index++) {
          if (respuestas[index].status == false) {
               tiendas_conectadas[index] = '';
          }

     }

     res.send(tiendas_conectadas);
});

// //Endpoint para sumar monto  total compras de tienda
app.get('/Total-tienda', function (req, res) {
     var total_local = 0;
     //      //calculo total de producto locales
     for (let index = 0; index < datos_tienda.compras.total.length; index++) {
          total_local = total_local + datos_tienda.compras.total[index];
     }

     res.send({ total_local });

});

// //Endpoint para sumar monto  total de tiendas
app.get('/Total-tiendas', async (req, res) => {

     var total = 0;
     let peticion = {
          uri: 'http://localhost:3500/confirmar-conexion-tiendas'
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

     res.send({ total_tiendas: suma });

});

// //producto de todos
app.get('/Listar-productos', async (req, res) => {
     var respuest = [];
     var total = 0;
     let peticion = {
          uri: 'http://localhost:3500/confirmar-conexion-tiendas'
     };

     await request(peticion).then((response) => {

          console.log('respuesta :: ', response);

     }).catch(function (err) {
          console.log('respuesta de error :: ', err);
     });


     var array_producto = [];
     var array_cantidad = [];
     var array_precio = [];

     for (let index = 0; index < tiendas_conectadas.length; index++) {

          let ip = tiendas_conectadas[index].tienda_ip;
          let puerto = tiendas_conectadas[index].puerto;

          let peticion = {
               uri: 'http://' + ip + ':' + puerto + '/productos'
          };

          await request(peticion).then((response) => {


               var respuesta = JSON.parse(response);
               console.log("momo::" + respuesta.producto)
               console.log("momo::" + respuesta.cantidad)
               console.log("momo::" + respuesta.precio)
               for (let index = 0; index < respuesta.producto.length; index++) {
                    array_producto.push(respuesta.producto[index]);
                    array_cantidad.push(respuesta.cantidad[index]);
                    array_precio.push(respuesta.precio[index]);
               }
               console.log("g;vfng;ksndf;kvbd;fnb;xf;bnxdlfnblnxlnb hola::")
               var suma_cantidad = 0;
               var suma_precio = 0;
               var contenedor = [];


               for (let index = 0; index < array_producto.length; index++) {
                    var product = array_producto[index];

                    for (let index = 0; index < array_producto.length; index++) {
                         if (product == array_producto[index]) {
                              contenedor.push(index);
                         }
                    }
                    console.log("contenedor " + contenedor)
                    for (let index = 0; index < contenedor.length; index++) {


                         let x = array_cantidad[contenedor[index]];
                         let y = array_precio[contenedor[index]];

                         suma_cantidad = suma_cantidad + x;
                         suma_precio = suma_precio + y;



                         console.log('x ' + x)
                         console.log('sumac ' + suma_cantidad)
                         console.log('y ' + y)




                    }
                    contenedor = [];
                    console.log("g;vfng;ksndf;kvbd;fnb;xf;bnxdlfnblnxlnb hola3::")
                    respuest.push({ product, suma_cantidad, suma_precio });
                    console.log("g;vfng;ksndf;kvbd;fnb;xf;bnxdlfnblnxlnb hola4::", respuest)
                    suma_cantidad = 0
                    suma_precio = 0

               }

          }).catch(function (err) {
               console.log('respuesta de error::: ', err);
          })

     }

     res.send({ respuest });

});




app.listen(3500, () => {
     console.log('Escuchando peticiones en el puerto 3500');
});