angular.module('starter.controllers', [])

.controller('mapa', function(NgMap, $scope) {
    var vm = this;
    vm.directionsDisplay = new google.maps.DirectionsRenderer();
    vm.directionsService = new google.maps.DirectionsService();
    NgMap.getMap().then(function(map) {
        vm.map = map;
        //console.log('map', vm.map);
        vm.directionsDisplay.setMap(vm.map);
        vm.actual = vm.map.markers.actual.position;
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
        vm.punto = punto;
        var destino = vm.punto.pos[0] + ', ' + vm.punto.pos[1];
        vm.map.showInfoWindow('ventanaPunto', vm.punto.id);
        vm.dirRequest = {
          origin: vm.actual,
          destination: destino,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        };
        console.log(vm.dirRequest);
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
.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

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