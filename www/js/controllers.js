angular.module('starter.controllers', [])

.controller('inicio', function($scope) {
    if (ionic.Platform.isAndroid()) {
        $scope.materialCSS = "css/ionic.material.min.css";
        $scope.materialJS = "js/ionic.material.min.js";
    }
})
.controller('mapa', function(NgMap, $scope) {
    var vm = this;
    vm.directionsDisplay = new google.maps.DirectionsRenderer();
    vm.directionsService = new google.maps.DirectionsService();
    NgMap.getMap().then(function(map) {
        vm.map = map;
        //console.log('map', vm.map);
        vm.directionsDisplay.setMap(vm.map);
        vm.directionsDisplay.setPanel(document.getElementById('directions-panel'));
        vm.actual = vm.map.markers.actual.position;
        vm.puntos.forEach(function(elem){
            var marker = vm.map.markers[elem.id];
            google.maps.event.addListener(marker, "mousedown", function() {
                console.log('marker', marker);
                console.log('elem.pos', elem.pos);
                vm.abreVentana(elem, elem);
            });
        });
        var pos;
        if (vm.actual === undefined) {
            vm.actual = noGeo();
            pos = {lat: vm.actual.lat, lng: vm.actual.lng};
        } else {
            pos = {lat: vm.actual.lat(), lng: vm.actual.lng()};
        }
        vm.bordes = new google.maps.LatLngBounds();
        vm.bordes.extend(vm.actual);
        vm.bordes.extend(vm.map.markers[find_closest_marker(vm, pos)].position);
        vm.map.fitBounds(vm.bordes);
// Inicialmente parecía buena idea apagar la ruta cuando el usuario cerraba la infoWindow
/*
        vm.apagaVentana = google.maps.event.addListener(vm.map.infoWindows.ventanaPunto, 'closeclick', function(){
            vm.apagar();
        });
*/
    });
    vm.iconoBox = {
        url: 'img/box.png',
        origin: [0, 0],
        anchor: [11, 32]
    };
    vm.puntos =[
        {id:"punto1", nombre:"Punto número uno", pos:[4.681175, -74.062391], direccion:"Carrera 49a #93-02"},
        {id:"punto2", nombre:"Punto número dos", pos:[4.696334, -74.062655], direccion:"Carrera 53 #106-99"}
    ];
    vm.punto = vm.puntos[0];
    vm.abreVentana = function(e, punto) {
        console.log(punto.pos);
        vm.punto = punto;
        var destino = vm.punto.pos[0] + ', ' + vm.punto.pos[1];
        vm.map.showInfoWindow('ventanaPunto', vm.punto.id);
        vm.dirRequest = {
          origin: vm.actual,
          destination: destino,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        };
        console.log('vm.dirRequest', vm.dirRequest);
    };
    vm.llegar = function() {
        vm.directionsService.route(vm.dirRequest, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                vm.directionsDisplay.setDirections(response);  
            }
        });
    };
    vm.apagar = function() {
        vm.directionsDisplay.set('directions', null);
    };
})
.controller('rastreoCtrl', function($scope, $ionicModal, $timeout, $ionicLoading) {    
    // Form data for the resRastreo modal
    $scope.datoRastreo = {};
    // Crea la resRastreo modal
    $ionicModal.fromTemplateUrl('templates/resultadoRastreo.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.resRastreo = modal;
    });
    // El usuario envió datos de rastreo
    $scope.rastrea = function(){
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner>'
        });
        // Luego de un segundo, aparece la ventana con info del rastreo
        $timeout(function(){
            $ionicLoading.hide();
            $scope.resRastreo.show();
        }, 1000);
    };
    // Se activa cuando se cierra la modal de rastreo
    $scope.cierraRastreo = function() {
        $scope.resRastreo.hide();
    };
    $scope.show = function() {
        $ionicLoading.hide();
    };
    $scope.hide = function(){
    };

})
.factory('ServicioBuscaCiudades', function($q, $timeout) {
    var BuscaCiudades = function(searchFilter) {
        var deferred = $q.defer();
	    var matches = ciudades.filter(function(ciudad) {
	    	if (ciudad.nombre.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1) {
                return true;
            }
	    });
        $timeout(function() {
           deferred.resolve(matches);
        }, 100);
        return deferred.promise;
    };
    return {BuscaCiudades : BuscaCiudades};
})
.controller('cotizarCtrl', function($scope, ServicioBuscaCiudades, $http, $ionicLoading, $ionicModal, $timeout, $filter) {
    $scope.ciudadOrigen = '';
    // Usando parte de http://codepen.io/calendee/pen/pCwyx para el autocomplete
    $scope.municipios = {};
    $scope.datoCiudades = {"ciudades" : [], "buscar" : '' }; // Para las ciudades origen
    $scope.datoCiudadesDestino = {"ciudades" : [], "buscar" : '' };
    $scope.numUnidades = [];
    $scope.numKilos = [];
    $scope.numCms = [];
    // El archivo municipios.json está local, pero si hay algún problema cargándolo, se hace un Loading
    $ionicLoading.show({
        template: '<ion-spinner></ion-spinner><h2>Cargando listado de ciudades...</h2>'
    });
    $http.get('js/municipios.json').then(function(res){
        $ionicLoading.hide();
        // Carga de ciudades de Colombia
        $scope.municipios = res.data.Colombia; // El listado es de solo Colombia, pero el objeto inicial es Colombia
        ciudades = [];
        for (var index in $scope.municipios) {
            var depto = $scope.municipios[index];
            depto.forEach(function(mun){
                ciudades.push({'nombre' : mun, 'departamento' : index});
            });
        }
        ciudades = ciudades.sort(function(a, b) {
            var ciudadA = a.nombre.toLowerCase();
            var ciudadB = b.nombre.toLowerCase();
            if (ciudadA > ciudadB) return 1;
            if (ciudadA < ciudadB) return -1;
            return 0;
        });
        $scope.buscarCiudades = function() {
            ServicioBuscaCiudades.BuscaCiudades($scope.datoCiudades.buscar).then(
                function(matches) {
                    $scope.datoCiudades.ciudades = matches;
                }
            );
        };
        $scope.buscarCiudadesDestino = function() {
            ServicioBuscaCiudades.BuscaCiudades($scope.datoCiudadesDestino.buscar).then(
                function(matches) {
                    $scope.datoCiudadesDestino.ciudades = matches;
                }
            );
        };
        $scope.iniciaBuscaOrigen = function() {
            $scope.datoCiudadesDestino.ciudades = [];
        };
        $scope.iniciaBuscaDestino = function() {
            $scope.datoCiudades.ciudades = [];
        };
        $scope.seleccionaOrigen = function(ciudad){
            $scope.datoCiudades.buscar = ciudad.nombre;
            $scope.datoCiudades.ciudades = [];
            $scope.ciudadOrigen = {'nombre' : ciudad.nombre, 'departamento' : ciudad.departamento};
        };
        $scope.seleccionaDestino = function(ciudad){
            $scope.datoCiudadesDestino.buscar = ciudad.nombre;
            $scope.datoCiudadesDestino.ciudades = [];
            $scope.ciudadDestino = {'nombre' : ciudad.nombre, 'departamento' : ciudad.departamento};
        };
    });
    for (var i = 1; i < 11; i++) {
        $scope.numUnidades.push(i);
    }
    for (i = 0.5; i < 50.5; i = i + 0.5) {
        $scope.numKilos.push(i);
    }
    for (i = 10; i < 110; i = i + 10) {
        $scope.numCms.push(i);
    }
    // Crea la resCotiza modal
    $ionicModal.fromTemplateUrl('templates/resultadoCotiza.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.resCotiza = modal;
    });
    // Se activa cuando se cierra la modal de cotización
    $scope.cierraCotiza = function() {
        $scope.resCotiza.hide();
    };
    $scope.cotiza = function() {
        // Los datos finales son: $scope.ciudadOrigen, $scope.ciudadDestino,
        // $scope.cantidad, $scope.peso, $scope.alto, $scope.ancho, $scope.profundo, $scope.mercancia
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner>'
        });
        // Luego de un segundo, aparece la ventana con info de la cotización
        $timeout(function(){
            $ionicLoading.hide();
            $scope.valorCotiza = 56000;
            $scope.resCotiza.show();
        }, 1000);
    };
    // Aproxima los valores y les da formato
    $scope.fijaValor = function(){
        $scope.mercancia = $scope.valor;
        $scope.valor = $filter('currency')($scope.valor, '$', 0);
        //$scope.valor = $scope.valor + '000';
    };
    $scope.cambiaValor = function(){
        $scope.valor = $scope.mercancia;
    };
})
.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

  /* Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  */


  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})


.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
// Funciones genéricas de cálculo y obtención de resultados
//
    var ciudades = [{'nombre' : 'Bogotá', 'departamento' : 'Bogotá'}, {'nombre' : 'Medellín' , 'departamento' : 'Antioquia'}];
// Adaptada de http://stackoverflow.com/questions/4057665/google-maps-api-v3-find-nearest-markers
function rad(x) {
    return x*Math.PI/180;
}
function find_closest_marker(vm, pos) {
    var lat = pos.lat;
    var lng = pos.lng;
    var R = 6371; // radius of earth in km
    var distances = [];
    var closest = -1;
    for(var i = 0; i < vm.puntos.length; i++ ) {
        var mlat = vm.puntos[i].pos[0];
        var mlng = vm.puntos[i].pos[1];
        var dLat  = rad(mlat - lat);
        var dLong = rad(mlng - lng);
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(rad(lat)) * Math.cos(rad(lat)) * Math.sin(dLong/2) * Math.sin(dLong/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        distances[i] = d;
        if (closest == -1 || d < distances[closest]) {
            closest = i;
        }
    }
    return vm.puntos[closest].id;
}
// Usando el ejemplo de geolocalización HTML5 de https://developers.google.com/maps/documentation/javascript/examples/map-geolocation
function noGeo() {
    var salida = new google.maps.Marker;
    var pos = {lat: 4.597988, lng: -74.075799};
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
        pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        return pos;
        }, function() {
            return pos;
        });
    } else {
        return pos;
    }
}
