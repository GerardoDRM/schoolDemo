angular.module('SchoolApp').controller('ProfessorController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.prof = {};
  $scope.prof.levelList = [];
  $scope.selectedItem = null;
  $scope.searchText = null;
  $scope.querySearch = querySearch;
  $scope.courses = loadCourses();
  $scope.selectedCourses = [];
  $scope.autocompleteDemoRequireMatch = true;
  // Stored objects
  $scope.professors = [];

  $scope.levelRef = {
    "c1": "Primaria",
    "c2": "Secundaria",
    "c3": "Preparatoria",
    "c4": "Licenciatura"
  }

  $('#professor-tab').click(function() {
    $('#ProfessorCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/school/teachers',
      params: {
        "level": "c3"
      }
    }).then(function successCallback(response) {
      console.log(response.data);
      var dataList = response.data['teachers'];
      for (var prof in dataList) {
        var drawProf = dataList[prof];
        drawProf.levelList = drawProf.level;
        // Adding object to global array
        // This tip will save a server request
        $scope.professors.push(drawProf);
        _addProfessor(drawProf)
      }
    }, function errorCallback(response) {});
  });

  $scope.addProfessor = function(ev) {
    // Show dialog
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      contentElement: '#ProfessorDialog',
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
    $scope.prof.password = randomstring;
  }

  $scope.createProfessor = function() {
    // Create Professor
    // Add level keys on array to
    // indentify which levels are included
    var l = $scope.prof.level;
    for (var level in l) {
      if (l[level]) {
        $scope.prof.levelList.push(level);
      }
    }
    // Get courses in a list
    var courses_key = [];
    for (var j in $scope.selectedCourses) {
      courses_key.push($scope.selectedCourses[j].code);
    }
    var updated = {
      "name": $scope.prof.name,
      "password": $scope.prof.password,
      "email": $scope.prof.email,
      "level": $scope.prof.levelList,
      "courses": courses_key
    }
    var flag = false;
    if ($scope.prof._id !== undefined) {
      updated['id'] = parseInt($scope.prof._id);
      flag = true;
    }
    console.log(updated);

    $http({
      method: 'PUT',
      url: '/api/v0/school/teachers',
      data: updated
    }).then(function successCallback(response) {
      if (!flag) {
        // Update UI
        $scope.prof._id = response.data['prof_id'];
        // Adding object to global array
        // This tip will save a server request
        $scope.professors.push($scope.prof);
        _addProfessor($scope.prof);
      }
      $scope.selectedCourses = [];
      // Clean announ object
      $scope.prof = {};
      $scope.prof.levelList = [];
    }, function errorCallback(response) {});
    // Close dialog
    $mdDialog.cancel();
  }

  /*
   * This function compile javascript template
   * in order to generate a professor on the DOM
   * @params - professor object
   */
  function _addProfessor(prof) {
    var levels = "";
    var courses = "";
    for (var i in prof.levelList) {
      levels += $scope.levelRef[prof.levelList[i]] + ", ";
    }
    for (var j in $scope.selectedCourses) {
      courses += $scope.selectedCourses[j].name + ", ";
    }

    // Compile to DOM
    angular.element(document.getElementById('ProfessorCards')).append($compile(
      '<md-card class="card-prof md-whiteframe-8dp col-sm-4" id=' + prof._id + '>' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-6">' +
      '<h1 class="md-headline no-margin"> ' + prof.name + ' </h1>' +
      '<p class="md-subhead"> ' + courses + '</p>' +
      '<p class="md-subhead"> ' + levels + '</p>' +
      '</div>' +
      '<div class="col-sm-6"> ' +
      '<md-button class="md-raised button-eliminate" ng-click="editProfessor(' + prof._id + ', $event)">Editar</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteProfessor(' + prof._id + ')">Eliminar</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

  // This method search on professors array
  // this helps us a request to the server
  $scope.editProfessor = function(id, ev) {
    var dataList = $scope.professors;
    for (var prof in dataList) {
      var professor = dataList[prof];
      if (professor._id == id) {
        $scope.prof = professor;
        console.log(professor);
        // Adding courses
        var courses = $scope.prof.courses;
        for (var i = 0; i < courses.length; i++) {
          for (var j = 0; j < $scope.courses.length; j++) {
            if (courses[i] == $scope.courses[j].code) {
              $scope.selectedCourses.push($scope.courses[j]);
            }
          }
        }
        // $scope.selectedCourses.push();
        $mdDialog.show({
          contentElement: '#ProfessorDialog',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true
        });
        break;
      }
    }
  }

  // This methos delete a professor from database
  $scope.deleteProfessor = function(id) {
    $http({
      method: 'DELETE',
      url: '/api/v0/school/teachers',
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
