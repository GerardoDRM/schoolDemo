angular.module('SchoolApp').controller('StudentCourseCtrl', ['$scope', '$http', '$compile',  function($scope, $http, $compile) {
  $scope.id = parseInt($("#userId").val());
  $scope.levelRef = {
    "c1": "Primaria",
    "c2": "Secundaria",
    "c3": "Bachillerato",
    "c4": "Licenciatura"
  }

  $('#classesBtn').click(function() {
    $('#courseCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/student/courses/' + $scope.id,
    }).then(function successCallback(response) {
      var dataList = response.data['courses'];
      for (var cour in dataList) {
        var drawCourse = dataList[cour];
        drawCourse.levelList = drawCourse.level;
        _addCourse(drawCourse);
      }

    }, function errorCallback(response) {});
  });

  $scope.goToCourse = function(id) {
    window.location = "student/class/" + id;
  }

  /*
   * This function compile javascript template
   * in order to generate a professor on the DOM
   * @params - professor object
   */
  function _addCourse(cou) {
    var level = $scope.levelRef[cou.level];

    // Compile to DOM
    angular.element(document.getElementById('courseCards')).append($compile(
      '<div class="col-sm-3">' +
      '<md-card class="general-card md-whiteframe-8dp no-padding" id=' + cou._id + '>' +
      '<div class="header-card">' +
      '<img src="/static/images/design/blackboard.svg" width="50px" height="50px" />' +
      '</div>' +
      '<md-card-title-text>' +
      '<div class="center-card">' +
      '<p class="no-padding"> ' + cou._id + '</p>' +
      '<p class="no-padding"> ' + level + '</p>' +
      '</div>' +
      '<md-button class="md-raised button-eliminate" ng-click="goToCourse(\'' + cou._id + '\', $event)">Ir al curso</md-button>' +
      '</md-card-title-text> ' +
      '</md-card></div>'
    )($scope));
  }

}]);
