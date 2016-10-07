angular.module('SchoolApp').controller('StudentOnCourseCtrl', ['$scope', '$compile', '$http', function($scope, $compile, $http) {
  $scope.students = [];
  $scope.id = $("#courseId").val();
  $scope.section = 1;
  var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septimbre", "Octubre", "Noviembre", "Diciembre"];

  $('#studentsCtrl').click(function() {
    $scope.students = [];
    $scope.getStudents();
  });

  /**
   * This function gets students attendance by month and
   * It should has a editable tamplate in order to update
   * attendance
   **/
  $scope.getStudents = function() {
    // Add Days in month
    $scope.current_month = months[moment().month()] + " " + moment().year();
    for (var i = 1; i <= moment().daysInMonth(); i++) {
      _addDaysInMonth(i);
    }

    $("#students-content").empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/students/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      var students = response.data["students"];
      for (var i in students) {
        _addStudent(students[i]);
      }
    }, function errorCallback(response) {});
  }

  var _addDaysInMonth = function(day) {
    angular.element(document.getElementById('month-dates')).append($compile(
      '<div class="date-box">' + day + '</div>'
    )($scope));
  }
  var _addStudent = function(stu) {
    angular.element(document.getElementById('students-content')).append($compile(
      '<tr class="md-row">' +
      '<td> <img src="/static/images/design/student.svg" width="50px"/> </td>' +
      '<td>' + stu._id + '</td>' +
      '<td>' + stu.name + '</td>' +
      '</tr>'
    )($scope));
    // angular.element(document.getElementById('students-content')).append($compile(
    //   '<tr class="md-row">' +
    //   '<td class="medium-box">' + stu._id + '</td>' +
    //   '<td class="medium-box">' + stu.name + '</td>' +
    //   '<td>' +
    //   '<div class="dates-inputs">' +
    //   '<div class="date-box">_</div>' +
    //   '<div class="date-box">_</div>' +
    //   '<div class="date-box">_</div>' +
    //   '</div>'+
    //   '</td>' +
    //   '</tr>'
    // )($scope));
  }
}]);
