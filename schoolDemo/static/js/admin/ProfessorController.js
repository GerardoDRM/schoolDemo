angular.module('SchoolApp').controller('ProfessorController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.prof = {};
  $scope.data = {};
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
    "c3": "Bachillerato",
    "c4": "Licenciatura"
  }

  $('#professor-tab').click(function() {
    $scope.prof = {};
    $scope.professors = [];
    $scope.selectedCourses = [];
    $scope.data.group = "c3";
    $scope.search();
  });

  $scope.search = function() {
    $('#ProfessorCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/school/teachers',
      params: {
        "level": $scope.data.group
      }
    }).then(function successCallback(response) {
      var dataList = response.data['teachers'];
      for (var prof in dataList) {
        var drawProf = dataList[prof];
        drawProf.levelList = drawProf.level;
        // Adding object to global array
        // This tip will save a server request
        $scope.professors.push(drawProf);
        _addProfessor(drawProf)
      }
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

  $scope.addProfessor = function(ev) {
    $scope.prof = {};
    $scope.prof.levelList = [];
    $scope.selectedCourses = [];
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
    $scope.prof.levelList = [];
    for (var level in l) {
      if (l[level]) {
        $scope.prof.levelList.push(level);
      }
    }
    // Get courses in a list
    var courses_key = [];
    for (var j in $scope.selectedCourses) {
      courses_key.push($scope.selectedCourses[j]._id);
    }
    var updated = {
      "name": $scope.prof.name,
      "password": $scope.prof.password,
      "email": $scope.prof.email,
      "level": $scope.prof.levelList,
      "courses": courses_key,
      "phone": $scope.prof.phone
    }
    var flag = false;
    if ($scope.prof._id !== undefined) {
      updated['id'] = parseInt($scope.prof._id);
      flag = true;
    }

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
      $('#professor-tab').click();
      addFeedback("Se han guardado los datos exitosamente", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
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
      levels += $scope.levelRef[prof.levelList[i]] + " ";
    }
    for (var j in $scope.selectedCourses) {
      courses += $scope.selectedCourses[j].name + " ";
    }

    // Compile to DOM
    angular.element(document.getElementById('ProfessorCards')).append($compile(
      '<div class="col-sm-4">' +
      '<md-card class="general-card md-whiteframe-8dp no-padding" id=' + prof._id + '>' +
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
      '</md-card></div>'
    )($scope));
  }

  // This method search on professors array
  // this helps us a request to the server
  $scope.editProfessor = function(id, ev) {
    $scope.selectedCourses = [];
    var dataList = $scope.professors;
    for (var prof in dataList) {
      var professor = dataList[prof];
      if (professor._id == id) {
        $scope.prof = professor;
        // Adding courses
        var courses = $scope.prof.courses;
        for (var i = 0; i < courses.length; i++) {
          for (var j = 0; j < $scope.courses.length; j++) {
            if (courses[i] == $scope.courses[j]._id) {
              $scope.selectedCourses.push($scope.courses[j]);
            }
          }
        }
        // Adding Level checkboxes
        $scope.prof.level = [];
        var levels = $scope.prof.levelList;
        for (var l = 0; l < levels.length; l++) {
          $scope.prof.level[levels[l]] = true;
        }
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
      // Remove from element from DOM
      $('#' + id).remove();
      addFeedback("El profesor ha sido eliminado", 'success');
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
