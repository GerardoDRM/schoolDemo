angular.module('SchoolApp').controller('CourseController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.cou = {};
  // Stored objects
  $scope.courses = [];
  $scope.levelRef = {
    "c1": "Primaria",
    "c2": "Secundaria",
    "c3": "Bachillerato",
    "c4": "Licenciatura"
  }

  $('#course-tab').click(function() {
    $('#CourseCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/school/courses',
      params: {
        "level": "c3"
      }
    }).then(function successCallback(response) {
      var dataList = response.data['courses'];
      for (var cour in dataList) {
        var drawCourse = dataList[cour];
        drawCourse.levelList = drawCourse.level;
        // Adding object to global array
        // This tip will save a server request
        $scope.courses.push(drawCourse);
        _addCourse(drawCourse)
      }
    }, function errorCallback(response) {});
  });

  $scope.addCourse = function(ev) {
    $scope.cou = {};
    // Show dialog
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      contentElement: '#CourseDialog',
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

  $scope.createCourse = function() {
    // Create Course
    var updated = {
      "id": $scope.cou._id,
      "name": $scope.cou.name,
      "description": $scope.cou.description,
      "level": $scope.cou.level,
      "semester": $scope.cou.semester
    }
    $http({
      method: 'PUT',
      url: '/api/v0/school/courses',
      data: updated
    }).then(function successCallback(response) {
      // Adding object to global array
      // This tip will save a server request
      $scope.courses.push($scope.cou);
      // Update UI
      $('#course-tab').click();
      $scope.selectedCourses = [];
      // Clean announ object
      $scope.cou = {};
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
  function _addCourse(cou) {
    var level = $scope.levelRef[cou.level];

    // Compile to DOM
    angular.element(document.getElementById('CourseCards')).append($compile(
      '<div class="col-sm-4">' +
      '<md-card class="general-card md-whiteframe-8dp no-padding" id=' + cou._id + '>' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-6">' +
      '<h1 class="md-headline no-margin"> ' + cou._id + ' </h1>' +
      '<p class="md-subhead"> ' + cou.name + '</p>' +
      '<p class="md-subhead"> ' + level + '</p>' +
      '</div>' +
      '<div class="col-sm-6"> ' +
      '<md-button class="md-raised button-eliminate" ng-click="editCourse(\'' + cou._id + '\', $event)">Editar</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteCourse(\'' + cou._id + '\')">Eliminar</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card></div>'
    )($scope));
  }

  // This method search on students array
  // this helps us a request to the server
  $scope.editCourse = function(id, ev) {
    var dataList = $scope.courses;
    for (var c in dataList) {
      var course = dataList[c];
      if (course._id == id) {
        console.log(course);
        $scope.cou = course;
        $mdDialog.show({
          contentElement: '#CourseDialog',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true
        });
        break;
      }
    }
  }

  // This methos delete a student from database
  $scope.deleteCourse = function(id) {
    $http({
      method: 'DELETE',
      url: '/api/v0/school/courses',
      data: {
        "id": id
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      addFeedback("Un curso ha sido eliminado", 'success');
      // Remove from element from DOM
      $('#' + id).remove();
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }


  $scope.closeDialog = function() {
    $mdDialog.cancel();
  }
}]);
