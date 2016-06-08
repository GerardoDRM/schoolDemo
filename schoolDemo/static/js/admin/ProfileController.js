angular.module('SchoolApp').controller('ProfileController', ['$scope', '$http', '$compile', function($scope, $http, $compile) {
  $scope.school = {}
  $scope.id = "57549fe07fc418fb0dbf1e57";

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
      // Select checkboxes
      $scope.school.level = {};
      var levels = schoolData.levels;
      var levelArray = ["c1","c2","c3","c4"];
      for(var l in levelArray) {
        var key = levelArray[l];
        levels.indexOf(key) > -1 ? $scope.school.level[key] = true : $scope.school.level[key] = false;
      }
    }, function errorCallback(response) {});
  }

  // Call Fisrt Time
  $scope.getData();

  $scope.storeData = function() {
    // Use PUT method in order to send data
    // to server
    // Create new Object
    var updated = {
      "name": $scope.school.name,
      "email":$scope.school.email,
      "description": $scope.school.description,
      "profile_photo":"",
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
