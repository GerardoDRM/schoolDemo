angular.module('SchoolApp').controller('TeacherCourseCtrl', ['$scope', '$http', '$compile',  function($scope, $http, $compile) {
  $scope.id = $("#userId").val();
  $scope.levelRef = {
    "c1": "Primaria",
    "c2": "Secundaria",
    "c3": "Preparatoria",
    "c4": "Licenciatura"
  }

  $('#classesBtn').click(function() {
    $('#courseCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/teacher/courses/' + $scope.id,
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

  $scope.goToCourse = function() {
    window.location = "teacher/class";
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
      '<md-button class="md-raised button-eliminate" style="margin:0;" ng-click="goToCourse(\'' + cou._id + '\', $event)">Ir al curso</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

}]);
