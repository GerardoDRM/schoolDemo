angular.module('SchoolApp').controller('StudentController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.stu = {};
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
    "c3": "Preparatoria",
    "c4": "Licenciatura"
  }

  $('#student-tab').click(function() {
    $('#StudentCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/school/students',
      params: {
        "level": "c3"
      }
    }).then(function successCallback(response) {
      console.log(response.data);
      var dataList = response.data['students'];
      for (var stu in dataList) {
        var drawStudent = dataList[stu];
        // Adding object to global array
        // This tip will save a server request
        $scope.students.push(drawStudent);
        _addStudent(drawStudent)
      }
    }, function errorCallback(response) {});
  });

  $scope.addStudent = function(ev) {
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
    // Create Student
    var updated = {
      "name": $scope.stu.name,
      "password": $scope.stu.password,
      "email": $scope.stu.email,
      "level": $scope.stu.level
    }
    $http({
      method: 'PUT',
      url: '/api/v0/school/students',
      data: updated
    }).then(function successCallback(response) {
      // Update UI
      $scope.stu._id = response.data['student_id'];
      // Adding object to global array
      // This tip will save a server request
      $scope.students.push($scope.stu);
      // Update UI
      _addStudent($scope.stu);
      $scope.selectedCourses = [];
      $scope.stu = {};
    }, function errorCallback(response) {});
    // Close dialog
    $mdDialog.cancel();
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
      '<md-card class="card-prof md-whiteframe-8dp col-sm-4" id=' + stu._id + '>' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-6">' +
      '<h1 class="md-headline no-margin"> ' + stu.name + ' </h1>' +
      '<p class="md-subhead"> ' + level + '</p>' +
      '</div>' +
      '<div class="col-sm-6"> ' +
      '<md-button class="md-raised button-eliminate" ng-click="editStudent(' + stu._id + ', $event)">Editar</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteStudent(' + stu._id + ')">Eliminar</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }


  // This method search on students array
  // this helps us a request to the server
  $scope.editStudent = function(id, ev) {
    console.log(id);
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
      console.log(response);
      // Remove from element from DOM
      $('#' + id).remove();
    }, function errorCallback(response) {
      console.log(response);
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
    var courses = [{
      'name': 'Matematicas',
      'code': 'M101',
      'sec': 001
    }, {
      'name': 'Algebra',
      'code': 'AL101',
      'sec': 001
    }, {
      'name': 'Algebra',
      'code': 'AL101',
      'sec': 002
    }, {
      'name': 'Literatura',
      'code': 'LI101',
      'sec': 001
    }, {
      'name': 'Logica',
      'code': 'LO101',
      'sec': 001
    }];

    return courses.map(function(course) {
      course._lowername = course.name.toLowerCase();
      course._lowertype = course.code.toLowerCase();
      return course;
    });
  }
}]);
