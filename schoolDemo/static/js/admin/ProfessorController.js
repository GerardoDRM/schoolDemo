angular.module('SchoolApp').controller('ProfessorController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');

  $scope.addProfessor = function(ev) {
    // Show dialog
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      templateUrl: '/static/templates/dialogProfessor.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: useFullScreen
    });
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };


  /*
   * This function works as dialog contoller
   * It's using same global variables from parent AnnouncementContoller
   * @closeDialog - Close Dialog
   * @createAnnouncement - Call private function _addAnnouncement
  */
  function DialogController($scope, $mdDialog, $compile) {
    $scope.prof = {};
    $scope.prof.levelList = [];

    $scope.closeDialog = function() {
      $mdDialog.cancel();
    }

    $scope.createProfessor = function() {
      // Create Professor
      // Add level keys on array to
      // indentify which levels are included
      var l = $scope.prof.level;
      for(var level in l) {
        if (l[level]) {
          $scope.prof.levelList.push(level);
        }
      }
      _addProfessor($scope.prof);
      // Clean announ object
      $scope.prof = {};
      // Close dialog
      $mdDialog.cancel();
    }
  }

  /*
   * This function compile javascript template
   * in order to generate an announcement on the DOM
   * @params -
  */
  function _addAnnouncement(announ) {
    var levels = "";
    for(var i in prof.levelList)
      levels += prof.levelList[i] + " ";
    // Compile to DOM
    angular.element(document.getElementById('ProfessorCards')).append($compile(
      '<md-card class="card-anoun">' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-6">' +
      '<span class="md-headline"> ' + prof.title + ' </span>' +
      '</div>' +
      '<div class="col-sm-6" style="height: 22;">' +
      '<img  alt="." src="/static/images/calendar.svg">' +
      '<p> 10/02/17' +
      '</p>' +
      '</div>' +
      '</div>' +
      '<span class="md-subhead"> ' + prof.content + '</span>' +
      '<span class="md-subhead"> ' + levels + '</span>' +
      '</md-card-title-text> ' +
      '<md-button class="md-raised button-eliminate">Eliminar</md-button>' +
      '</md-card>'
    )($scope));
  }



}]);
