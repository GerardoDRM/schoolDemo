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
      console.log(response.data);
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
      '<md-card class="card-prof md-whiteframe-8dp col-sm-4" id=' + cou._id + '>' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-12">' +
      '<h1 class="md-headline no-margin"> ' + cou.name + ' </h1>' +
      '<md-card-content>' +
      '<p class="no-padding"> ' + cou._id + '</p>' +
      '<p class="no-padding"> ' + level + '</p>' +
      '<p class="no-padding">' +
      cou.description +
      '</p>' +
      '</md-card-content>' +
      '<div class="blackboard"><img src="/static/images/design/blackboard.svg"></div>' +
      '<md-button class="md-raised button-eliminate" style="margin:0;" ng-click="goToCourse(\'' + cou._id + '\', $event)">Ir al curso</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

}]);
