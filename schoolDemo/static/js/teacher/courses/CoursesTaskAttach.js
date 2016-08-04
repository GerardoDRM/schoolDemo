angular.module('SchoolApp').controller('CoursesTaskAttach', ['$scope', '$compile', '$http', function($scope, $compile, $http) {
  $scope.id = $("#courseId").val();
  $scope.section = 1;
  $scope.resource = {};
  $scope.resources = [];
  $scope.position_task = parseInt($("#taskPos").val());
  $scope.published_date = parseInt($("#taskDate").val());
  $scope.grades = {};

  $scope.getAttachments = function() {
    $scope.resource = {};
    $scope.resources = [];
    $scope.grades = {};

    $('#hw-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/task/attach/' + $scope.id + "/" + $scope.section,
      params: {
        "published_date": $scope.published_date
      }
    }).then(function successCallback(response) {
      var dataList = response.data['attachments'];
      for (var i = 0; i < dataList.length; i++) {
        _addHw(dataList[i], i);
      }
    }, function errorCallback(response) {});
  }

  $scope.getAttachments();


  var _addHw = function(hw, pos) {
    $scope.grades['p' + pos] = hw.grade;
    // Compile to DOM
    angular.element(document.getElementById('hw-content')).append($compile(
      '<tr>' +
      '<td>' + hw.student + '</td>' +
      '<td>' + hw.student_name + '</td>' +
      '<td>' + hw.url + '</td>' +
      '<td><md-input-container><input type="text" ng-model="grades.p' + pos + '"></input></md-input-container></td>' +
      '<td>' +
      '<md-button class="md-raised" ng-click="updateGrade(' + pos + ')">Subir Calificacion</md-button>' +
      '<md-button class="md-raised" ng-click="downloadZip(\'' + hw.url + '\')">Descargar Tarea</md-button>' +
      '</td>' +
      '</tr>'
    )($scope));
  }

  $scope.downloadZip = function(url) {
    window.location.href = "/static/tasks/" + url;
  }

  $scope.updateGrade = function(pos) {

    // Check if is an update
    if ($scope.grades['p' + pos] == undefined) {
      $scope.grades['p' + pos] = 0.0;
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/task/grade/' + $scope.id + "/" + $scope.section,
      data: {
        "position_task": $scope.position_task,
        "grade": parseFloat($scope.grades['p' + pos]),
        "position_attach": pos
      }
    }).then(function successCallback(response) {
      addFeedback("Se ha actualizado las calificaciones", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

}]);
