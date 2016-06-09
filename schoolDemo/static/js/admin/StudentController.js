angular.module('SchoolApp').controller('StudentController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.stu = {};
  $scope.stu.levelList = [];
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
    $scope.prof.password = randomstring;
  }

  $scope.createProfessor = function() {
    // Create Professor
    // Add level keys on array to
    // indentify which levels are included
    var l = $scope.stu.level;
    for (var level in l) {
      if (l[level]) {
        $scope.stu.levelList.push(level);
      }
    }
    // Adding object to global array
    // This tip will save a server request
    $scope.students.push($scope.stu);
    // Update UI
    _addStudent($scope.stu);
    $scope.selectedCourses = [];
    // Clean announ object
    $scope.stu = {};
    $scope.stu.levelList = [];
    // Close dialog
    $mdDialog.cancel();
  }

  /*
   * This function compile javascript template
   * in order to generate a professor on the DOM
   * @params - professor object
   */
  function _addStudent(stu) {
    var levels = "";
    var courses = "";
    for (var i in stu.levelList) {
      levels += $scope.levelRef[stu.levelList[i]] + ", ";
    }
    for (var j in $scope.selectedCourses) {
      courses += $scope.selectedCourses[j].name + ", ";
    }

    // Compile to DOM
    angular.element(document.getElementById('StudentCards')).append($compile(
      '<md-card class="card-prof md-whiteframe-8dp col-sm-4" id='+ '' +'>' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-6">' +
      '<h1 class="md-headline no-margin"> ' + stu.name + ' </h1>' +
      '<p class="md-subhead"> ' + courses + '</p>' +
      '<p class="md-subhead"> ' + levels + '</p>' +
      '</div>' +
      '<div class="col-sm-6"> '+
      '<md-button class="md-raised button-eliminate" ng-click="editProfessor('+ '' +')">Editar</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteProfessor('+ '' +')">Eliminar</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
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
