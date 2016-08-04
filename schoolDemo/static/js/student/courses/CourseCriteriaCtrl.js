angular.module('SchoolApp').controller('CourseCriteriaCtrl', ['$scope', '$compile', '$http', function($scope, $compile, $http) {
  $scope.criteria = {};
  $scope.id = $("#courseId").val();
  $scope.section = 1;

  $('#criteriaBtn').click(function() {
    $scope.criteria = {};
    $scope.getCriteria();
  });

  $scope.getCriteria = function() {
    $http({
      method: 'GET',
      url: '/api/v0/courses/criteria/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      $scope.criteria = response.data;
    }, function errorCallback(response) {});
  }

}]);
