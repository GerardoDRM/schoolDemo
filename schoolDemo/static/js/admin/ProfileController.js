angular.module('SchoolApp').controller('ProfileController', ['$scope', '$http', '$compile', function($scope, $http, $compile) {
  $scope.school = {}
  $scope.id = "57549fe07fc418fb0dbf1e57";
  $scope.photo = {file: ''};

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
      // Select checkboxes
      $scope.school.level = {};
      var levels = schoolData.levels;
      var levelArray = ["c1","c2","c3","c4"];
      for(var l in levelArray) {
        var key = levelArray[l];
        levels.indexOf(key) > -1 ? $scope.school.level[key] = true : $scope.school.level[key] = false;
      }

      // Change ui
      // Add preview image
      // First get img element
      var parent = $("#profilePhoto");
      $(parent[0]).css({
        'display' : 'none'
      });
      var previewImage = $(parent[0]).next();
      $(previewImage[0]).css({
        "background-image": "url(" + $scope.photo.file + ")",
        "background-size": "cover",
        'display': 'block'
      });
    }, function errorCallback(response) {});
  }

  // Call Fisrt Time
  $scope.getData();

  $scope.storeData = function() {
    console.log($scope.photo);
    // Use PUT method in order to send data
    // to server
    // Create new Object
    var updated = {
      "name": $scope.school.name,
      "email":$scope.school.email,
      "description": $scope.school.description,
      "profile_photo": $scope.photo.file,
      "address": $scope.school.address,
      "in_charge": $scope.school.in_charge,
      "in_charge_job": $scope.school.in_charge_job,
      "phone": $scope.school.phone
    }
    console.log(updated);
    $http({
        method: 'PUT',
        url: '/api/v0/school/info/' + $scope.id,
        data: updated
      }).then(function successCallback(response) {
        console.log(response);
      }, function errorCallback(response) {
      });
  };
}]);
