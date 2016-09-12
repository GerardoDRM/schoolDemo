angular.module('SchoolApp').controller('ProfileController', ['$scope', '$http', '$compile', function($scope, $http, $compile) {
  $scope.school = {}
  $scope.id = parseInt($("#userId").val());
  $scope.photo = {
    file: ''
  };
  
  $scope.p_activate = false;

  $scope.getData = function() {
    $http({
      method: 'GET',
      url: '/api/v0/school/info/' + $scope.id,
    }).then(function successCallback(response) {
      var schoolData = response.data;
      $scope.school = schoolData
      $scope.school.phone = schoolData.address.phone;
      $scope.school.in_charge_job = schoolData.address.in_charge_job;
      $scope.school.in_charge = schoolData.address.in_charge;
      $scope.school.address = schoolData.address.street;
      $scope.photo.file = schoolData.profile_photo;

      // Change ui
      // Add preview image
      // First get img element
      if ($scope.photo.file !== undefined && $scope.photo.file != "") {
        var parent = $("#profilePhoto");
        $(parent[0]).css({
          'display': 'none'
        });
        var previewImage = $(parent[0]).next();
        $(previewImage[0]).css({
          "background-image": "url(" + $scope.photo.file + ")",
          "background-size": "cover",
          'display': 'block'
        });

        // Check if photo is from database
        $scope.p_activate = true;
      }

    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

  // Call Fisrt Time
  $scope.getData();

  $scope.storeData = function() {
    // Use PUT method in order to send data
    // to server
    // Create new Object
    var updated = {
        "name": $scope.school.name,
        "email": $scope.school.email,
        "description": $scope.school.description,
        "profile_photo": $scope.photo.file,
        "address": $scope.school.address,
        "in_charge": $scope.school.in_charge,
        "in_charge_job": $scope.school.in_charge_job,
        "phone": $scope.school.phone
      }
      // Check profile photo
    if ($scope.photo.file !== undefined && $scope.photo.file != "" && $("#adminProfile").valid()) {
      $http({
        method: 'PUT',
        url: '/api/v0/school/info/' + $scope.id,
        data: updated
      }).then(function successCallback(response) {
        if (response.data == 500) {
          addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
        } else {
          addFeedback("Los datos han sido almacenados correctamente", 'success');
          $scope.getData();
        }
      }, function errorCallback(response) {
        addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
      });
    } else {
      addFeedback("Por favor es necesario tener una foto de institucion, al igual que su nombre", 'error');
    }
  };


  $scope.deletePhoto = function($event) {
    var selectImage = $($event.target).parent().parent().prev();
    $(selectImage[0]).css({
      "display": "block"
    });
    var previewImage = $($event.target).parent().parent();
    $(previewImage[0]).css({
      "display": "none"
    });
    if ($scope.p_activate) {
      // Check image model
      var photo = {};
      photo.model = 'profile';
      $http({
        method: 'DELETE',
        url: '/api/v0/school/info/' + $scope.id
      }).then(function successCallback(response) {
        if (response.data == 500) {
          addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
        } else {
          addFeedback("Tú foto de perfil ha sido retirada", 'success');
          $scope.p_activate = false;
          $scope.photo = {
            file: ''
          };
        }
      }, function errorCallback(response) {
        addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
      });
    }
  }
}]);
