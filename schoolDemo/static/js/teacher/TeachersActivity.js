angular.module('SchoolApp').controller('TeachersActivityCtrl', ['$scope', '$http', '$compile', function($scope, $http, $compile) {
  $scope.id = parseInt($("#userId").val());

  $('#activitiesBtn').click(function() {
    $("#teachersTable").empty();
    $scope.getTeacherAnalytics();
  });

  $scope.getTeacherAnalytics = function() {
    $http({
      method: 'GET',
      url: '/api/v0/principal/views'
    }).then(function successCallback(response) {
      var activity = response.data["activity"];
      for (var i in activity) {
        _addTeachers(activity[i]);
      }
    }, function errorCallback(response) {});
  }

  var _addTeachers = function(act) {
    // Compile to DOM
    angular.element(document.getElementById('teachersTable')).append($compile(
      '<tr class="md-row">' +
      '<td>' + "<img src='/static/teachers/" + act.image + "' width='50px'/>" + '</td>' +
      '<td>' + act.teacher_name + '</td>' +
      '<td>' + act.course_name + '</td>' +
      '<td>' + act.hw + '</td>' +
      '<td>' + act.material + '</td>' +
      '<td>' + act.quiz + '</td>' +
      '<td>' +
      '<md-button class="md-raised button-eliminate md-primary" ng-click="goToProfile(\'' + act.course_id + '\')">Ver Perfil</md-button>' +
      '</td>' +
      '</tr>'
    )($scope));
  }

  $scope.goToProfile = function(id) {
    window.open("/teacher/class/" + id, "_blank");
  }
}]);
