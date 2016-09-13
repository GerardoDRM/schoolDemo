angular.module('SchoolApp').controller('StudentOnCourseCtrl', ['$scope', '$compile', '$http', function($scope, $compile, $http) {
  $scope.students = [];
  $scope.id = $("#courseId").val();
  $scope.section = 1;

  $('#studentsCtrl').click(function() {
    $scope.students = [];
    $scope.getStudents();
  });

  $scope.getStudents = function() {
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

  var _addStudent = function(stu) {
    angular.element(document.getElementById('students-content')).append($compile(
      '<tr class="md-row">' +
      '<td> <img src="/static/images/design/student.svg" width="50px"/> </td>' +
      '<td>' + stu._id + '</td>' +
      '<td>' + stu.name + '</td>' +
      '</tr>'
    )($scope));
  }
}]);
