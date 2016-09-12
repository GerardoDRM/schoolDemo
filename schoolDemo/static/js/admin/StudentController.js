angular.module('SchoolApp').controller('StudentController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.stu = {};
  $scope.data = {};
  $scope.selectedItem = null;
  $scope.searchText = null;
  $scope.querySearch = querySearch;
  $scope.courses = loadCourses();
  $scope.selectedCourses = [];
  $scope.autocompleteDemoRequireMatch = true;
  // Stored objects
  $scope.students = [];


  $scope.levelRef = {
    "c1": "Primaria",
    "c2": "Secundaria",
    "c3": "Bachillerato",
    "c4": "Licenciatura"
  }

  $('#student-tab').click(function() {
    $scope.students = [];
    $scope.selectedCourses = [];
    $scope.stu = {};
    $scope.data.group = "c3";
    $scope.courses = loadCourses();
    $scope.search();
  });

  $scope.search = function() {
    $('#StudentCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/school/students',
      params: {
        "level": $scope.data.group
      }
    }).then(function successCallback(response) {
      var dataList = response.data['students'];
      for (var stu in dataList) {
        var drawStudent = dataList[stu];
        // Adding object to global array
        // This tip will save a server request
        $scope.students.push(drawStudent);
        _addStudent(drawStudent)
      }
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

  $scope.addStudent = function(ev) {
    $scope.stu = {};
    $scope.selectedCourses = [];
    // Show dialog
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      contentElement: '#StudentDialog',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true
    });
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };

  // This method generate a random password
  $scope.generatePassword = function() {
    var randomstring = Math.random().toString(36).slice(-8);
    $scope.stu.password = randomstring;
  }

  $scope.createStudent = function() {
    // Get courses in a list
    var courses_key = [];
    for (var j in $scope.selectedCourses) {
      courses_key.push($scope.selectedCourses[j]._id);
    }

    // Create Student
    var updated = {
      "name": $scope.stu.name,
      "password": $scope.stu.password,
      "email": $scope.stu.email,
      "courses": courses_key,
      "level": $scope.stu.level
    }

    var flag = false;
    if ($scope.stu._id !== undefined) {
      updated['id'] = parseInt($scope.stu._id);
      flag = true;
    }

    if ($("#adminStudents").valid()) {

      $http({
        method: 'PUT',
        url: '/api/v0/school/students',
        data: updated
      }).then(function successCallback(response) {
        if (!flag) {
          // Update UI
          $scope.stu._id = response.data['student_id'];
          // Adding object to global array
          // This tip will save a server request
          $scope.students.push($scope.stu);
          // Update UI
          _addStudent($scope.stu);
        }
        $scope.selectedCourses = [];
        $scope.stu = {};
        $('#student-tab').click();
        addFeedback("Se han guardado los datos exitosamente", 'success');
      }, function errorCallback(response) {
        addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
      });
      // Close dialog
      $mdDialog.cancel();
    }
  }

  /*
   * This function compile javascript template
   * in order to generate a professor on the DOM
   * @params - professor object
   */
  function _addStudent(stu) {
    var level = $scope.levelRef[stu.level];
    var courses = "";
    for (var j in $scope.selectedCourses) {
      courses += $scope.selectedCourses[j].name + ", ";
    }

    // Compile to DOM
    angular.element(document.getElementById('StudentCards')).append($compile(
      '<div class="col-sm-3">' +
      '<md-card class="general-card md-whiteframe-8dp no-padding" id=' + stu._id + '>' +
      '<div class="header-card">' +
      '<img src="/static/images/design/student.svg" width="50px" height="50px" />' +
      '</div>' +
      '<md-card-title-text>' +
      '<div class="center-card">' +
      '<h1 class="md-headline no-margin"> ' + stu.name + ' </h1>' +
      '<p class="md-subhead"> ID:' + stu._id + '</p>' +
      '<p class="md-subhead"> Contraseña: ' + stu.password + '</p>' +
      '</div>' +
      '<md-button class="md-raised button-eliminate  md-primary" ng-click="editStudent(' + stu._id + ', $event)">Editar</md-button>' +
      '<md-button class="md-raised button-eliminate  md-warn" ng-click="deleteStudent(' + stu._id + ')">Eliminar</md-button>' +
      '</md-card-title-text> ' +
      '</md-card></div>'
    )($scope));
  }


  // This method search on students array
  // this helps us a request to the server
  $scope.editStudent = function(id, ev) {
    $scope.selectedCourses = [];
    var dataList = $scope.students;
    for (var stu in dataList) {
      var student = dataList[stu];
      if (student._id == id) {
        $scope.stu = student;
        // Adding courses
        var courses = $scope.stu.courses;
        if (courses !== undefined) {
          for (var i = 0; i < courses.length; i++) {
            for (var j = 0; j < $scope.courses.length; j++) {
              if (courses[i] == $scope.courses[j]._id) {
                $scope.selectedCourses.push($scope.courses[j]);
              }
            }
          }
        }
        $mdDialog.show({
          contentElement: '#StudentDialog',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true
        });
        break;
      }
    }
  }

  // This methos delete a student from database
  $scope.deleteStudent = function(id) {
    $http({
      method: 'DELETE',
      url: '/api/v0/school/students',
      data: {
        "id": parseInt(id)
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      addFeedback("El alumno ha sido eliminado", 'success');
      // Remove from element from DOM
      $('#' + id).remove();
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

  $scope.closeDialog = function() {
    $mdDialog.cancel();
  }

  /**
   * Chips Logic on Dialog
   * @required Transform function in order to pass the object
   * Query Search with a filter which gets possible objects
   * Filter witch Search inside array of objects
   */
  /**
   * Return the proper object when the append is called.
   */
  $scope.transformChip = function(chip) {
    // If it is an object, it's already a known chip
    if (angular.isObject(chip)) {
      return chip;
    }
  }

  function querySearch(query) {
    var results = query ? $scope.courses.filter(createFilterFor(query)) : [];
    return results;
  }

  /**
   * Create filter function for a query string
   */
  function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);

    return function filterFn(vegetable) {
      return (vegetable._lowername.indexOf(lowercaseQuery) === 0) ||
        (vegetable._lowertype.indexOf(lowercaseQuery) === 0);
    };
  }

  // This function request all courses on the institution
  // It works to map all couses to autocomplete
  function loadCourses() {
    // Get Courses List
    $http({
      method: 'GET',
      url: '/api/v0/school/courses/list'
    }).then(function successCallback(response) {
      $scope.courses = response.data['courses'];
      return $scope.courses.map(function(course) {
        course._lowername = course.name.toLowerCase();
        course._lowertype = course._id.toLowerCase();
        return course;
      });
    }, function errorCallback(response) {});
  }
}]);
