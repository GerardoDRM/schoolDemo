angular.module('SchoolApp').controller('HomeController', ['$scope', '$http', function($scope, $http) {
  $scope.school = {}
  $scope.user = {}

  $http({
    method: 'GET',
    url: '/api/v0/school',
  }).then(function successCallback(response) {
    var schoolData = response.data;
    $scope.school = schoolData
    $scope.school.phone = schoolData.address.phone;
    $scope.school.address = schoolData.address.street;
    if ($scope.school.profile_photo !== undefined) {
      $("#schoolPhoto").css({
        "background": "url(\'" + $scope.school.profile_photo + "\')",
        "background-repeat": "no-repeat",
        "background-size": "cover"
      });
    }

    console.log($scope.school);
    // Select checkboxes
  }, function errorCallback(response) {});


  $scope.login = function() {
    console.log($scope.user);
    // Check user role
    if($scope.user.role == "student") {
        window.location = '/student';
    } else if ($scope.user.role == "teacher") {
      window.location = '/teacher';
    } else if ($scope.user.role == "admin") {
      window.location = '/admin';
    }

  };

}]);
