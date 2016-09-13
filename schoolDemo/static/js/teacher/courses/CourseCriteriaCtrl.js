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
      $scope.criteria = response.data["criteria"];
      $scope.description = response.data["description"];

      // Add teacher image
      if (response.data["photo"] != "") {
        $("#teacher_photo").css({
          "background": "url(/static/teachers/" + response.data["photo"] + ") 50% 50% / cover no-repeat"
        });
      }
    }, function errorCallback(response) {});
  }

  $scope.storeCriteria = function() {
    var criteria = $scope.criteria;
    var updated = {
      "attendance": criteria.attendance !== undefined ? criteria.attendance : 0,
      "hw": criteria.hw !== undefined ? criteria.hw : 0,
      "exams": criteria.exams !== undefined ? criteria.exams : 0,
      "participation": criteria.participation !== undefined ? criteria.participation : 0,
      "extras": criteria.extras !== undefined ? criteria.extras : 0,
      "project": criteria.project !== undefined ? criteria.project : 0,
      "description": $scope.description
    }
    $http({
      method: 'POST',
      url: '/api/v0/courses/criteria/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      addFeedback("Se ha guardado el criterio correctamente", "success");
    }, function errorCallback(response) {});
  }

}]);
