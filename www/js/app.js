// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

angular.module('starter', ['ionic', 'ngCordova', 'firebase'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state("firebase", {
      url: "/firebase",
      templateUrl: "templates/firebase.html",
      controller: "FirebaseController",
      cache: false
    })
    .state("map", {
      url: "/map",
      templateUrl: "templates/map.html",
      controller: "MapController"
    })
    .state("secure", {
      url: "/secure",
      templateUrl: "templates/secure.html",
      controller: "SecureController"
    });
  $urlRouterProvider.otherwise('/firebase');
})
.factory('$localstorage', function($window) {
  return {
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
})
.factory("fb", function (Firebase) {
  var fbRef = new Firebase("https://incandescent-fire-4990.firebaseio.com/");
  return fbRef;
})
.controller("FirebaseController", function($scope, $state, $firebaseAuth, fb) {
  var fbAuth = $firebaseAuth(fb);

  if (fb.getAuth()) {
    $state.go("secure");
  }

  $scope.login = function(username, password) {
    fbAuth.$authWithPassword({
      email: username,
      password: password
    }).then(function(authData) {
      $state.go("map");
    }).catch(function(error) {
      console.error("ERROR: " + error);
    });
  }

  $scope.register = function(username, password) {
    fbAuth.$createUser({email: username, password: password}).then(function(userData) {
      return fbAuth.$authWithPassword({
        email: username,
        password: password
      });
    }).then(function(authData) {
      $state.go("map");
    }).catch(function(error) {
      console.error("ERROR: " + error);
    });
  }
})
.controller('MapController', function($scope, $cordovaGeolocation, $ionicLoading) {
  ionic.Platform.ready(function(){
    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
    });
     
    var posOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
      var lat  = position.coords.latitude;
      var long = position.coords.longitude;
       
      var myLatlng = new google.maps.LatLng(lat, long);
       
      var mapOptions = {
        center: myLatlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };          
         
      var map = new google.maps.Map(document.getElementById("map"), mapOptions);          
         
      $scope.map = map;   
      $ionicLoading.hide();           
         
    }, function(err) {
      $ionicLoading.hide();
      console.log(err);
    });
  });
})
.controller("SecureController", function($scope, $ionicHistory, $firebaseArray, $cordovaCamera, fb) {
  $ionicHistory.clearHistory();
  $scope.images = [];

  var fbAuth = fb.getAuth();
  if(fbAuth) {
    var userReference = fb.child("users/" + fbAuth.uid);
    var syncArray = $firebaseArray(userReference.child("images"));
    $scope.images = syncArray;
  } else {
    $state.go("firebase");
  }

  $scope.upload = function() {
    var options = {
      quality: 75,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      targetWidth: 500,
      targetHeight: 500,
      saveToPhotoAlbum: false
    };
    $cordovaCamera.getPicture(options)
      .then(function(imageData) {
        syncArray.$add({image: imageData}).then(function() {
          alert("Image has been uploaded");
        });
      }, function(error) {
        console.error(error);
      });
  }
})
