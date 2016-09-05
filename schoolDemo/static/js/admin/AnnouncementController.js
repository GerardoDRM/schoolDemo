angular.module('SchoolApp').controller('AnnouncementController', ['$scope', '$http', '$compile', '$mdDialog', '$mdMedia', function($scope, $http, $compile, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.levelRef = {
    "c1": "Primaria",
    "c2": "Secundaria",
    "c3": "Bachillerato",
    "c4": "Licenciatura"
  }

  $('#announ-tab').click(function() {
    $('#announcementCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/school/announcements/admin',
    }).then(function successCallback(response) {
      var dataList = response.data['announcements'];
      for (var announ in dataList) {
        var drawAnnoun = dataList[announ];
        drawAnnoun.levelList = drawAnnoun.level;
        _addAnnouncement(drawAnnoun)
      }
    }, function errorCallback(response) {});
  });

  $scope.addAnnouncement = function(ev) {
    // Show dialog
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
      controller: DialogController,
      templateUrl: '/static/templates/dialogAnnouncement.html',
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

  $scope.deleteAnnouncement = function(date) {
    $http({
      method: 'DELETE',
      url: '/api/v0/school/announcements/admin',
      data: {
        "publication_date": parseInt(date)
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      addFeedback("Se ha eliminado el aviso", 'success');
      // Remove from element from DOM
      $('#' + date).remove();
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }


  /*
   * This function works as dialog contoller
   * It's using same global variables from parent AnnouncementContoller
   * @closeDialog - Close Dialog
   * @createAnnouncement - Call private function _addAnnouncement
   */
  function DialogController($scope, $mdDialog, $compile) {
    $scope.announ = {};
    $scope.announ.levelList = [];

    $scope.closeDialog = function() {
      $mdDialog.cancel();
    }

    $scope.createAnnouncement = function() {
      // Create Announcement
      // Add level keys on array to
      // indentify which levels are included
      var l = $scope.announ.level;
      for (var level in l) {
        if (l[level]) {
          $scope.announ.levelList.push(level);
        }
      }

      var updated = {
        "title": $scope.announ.title,
        "content": $scope.announ.content,
        "date": moment().unix(),
        "level": $scope.announ.levelList
      }
      if ($("#adminAnnounces").valid()) {
        $http({
          method: 'PUT',
          url: '/api/v0/school/announcements/admin',
          data: updated
        }).then(function successCallback(response) {
          _addAnnouncement($scope.announ);
          // Clean announ object
          $scope.announ = {};
          addFeedback("Se ha agregado el aviso", 'success');
        }, function errorCallback(response) {
          addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
        });
        // Close dialog
        $mdDialog.cancel();
      }
    }
  }

  /*
   * This function compile javascript template
   * in order to generate an announcement on the DOM
   * @params -
   */
  function _addAnnouncement(announ) {
    var levels = "";
    for (var i in announ.levelList) {
      levels += $scope.levelRef[announ.levelList[i]] + " ";
    }
    var pDate = moment.unix(announ.publication_date).format("DD/MM/YYYY");

    // Compile to DOM
    angular.element(document.getElementById('announcementCards')).append($compile(
      '<md-card class="card-announ md-whiteframe-8dp" id=' + announ.publication_date + '>' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-8">' +
      '<h1 class="md-headline no-margin"> ' + announ.title + ' </h1>' +
      '<p class="md-subhead"> ' + announ.content + '</p>' +
      '<p class="md-subhead"> ' + levels + '</p>' +
      '</div>' +
      '<div class="col-sm-4"> ' +
      '<div class="col-sm-4" style="height:25px;"><img  alt="." src="/static/images/calendar.svg" width="25px"></div>' +
      '<div class="col-sm-8"><p>' + pDate + '</p></div>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteAnnouncement(' + announ.publication_date + ')">Eliminar</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }


}]);
