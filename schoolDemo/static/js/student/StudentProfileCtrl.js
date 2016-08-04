angular.module('SchoolApp').controller('StudentProfileCtrl', ['$scope', '$http', '$compile', function($scope, $http, $compile) {
  $scope.id = $("#userId").val();
  $scope.profile = {};

  $('#profileBtn').click(function() {
    $scope.getProfile();
  });

  $scope.getProfile = function() {
    $http({
      method: 'GET',
      url: '/api/v0/student/profile/' + $scope.id
    }).then(function successCallback(response) {
      $scope.profile = response.data;
      $scope.profile.id = $scope.id;
    }, function errorCallback(response) {});
  }

  $scope.getProfile();

  $scope.storeProfile = function() {
    var data = {
      "email": $scope.profile.email,
      "password": $scope.profile.password
    };
    $http({
      method: 'PUT',
      url: '/api/v0/student/profile/' + $scope.id,
      data: data
    }).then(function successCallback(response) {
      addFeedback("Se han guardado los datos exitosamente", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }
}]);
