angular.module('SchoolApp').controller('CourseTaskCtrl', ['$scope', '$compile', '$http','$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;

  $scope.hw = {};

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#taskBtn').click(function() {
    $('#hw-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/task/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      console.log(response.data);
      var dataList = response.data['tasks'];
      for(var task in dataList) {
        var draw = dataList[task];
        _addHw(draw);
      }
    }, function errorCallback(response) {});
  });

  var _addHw = function(hw) {
    var pDate = moment.unix(hw.published_date).format("DD/MM/YYYY");

    angular.element(document.getElementById('hw-content')).append($compile(
      '<md-card style="background:#E0E0E0">' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-8">' +
      '<h1 class="md-headline no-margin"> ' + hw.title + ' </h1>' +
      '<p class="md-subhead"> ' + hw.content + '</p>' +
      '</div>' +
      '<div class="col-sm-4"> ' +
      '<div class="col-sm-4" style="height:25px;"><img  alt="." src="/static/images/calendar.svg" width="25px"></div>' +
      '<div class="col-sm-8"><p>' + pDate + '</p></div>' +
      '<md-button class="md-raised button-eliminate" ng-click="editTask()">Editar Tarea</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteTask()">Eliminar Tarea</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

  $scope.showAdvanced = function(ev) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
        contentElement: '#CourseDialogTask',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        fullscreen: useFullScreen
      })
      .then(function(answer) {
        $scope.status = 'You said the information was "' + answer + '".';
      }, function() {
        $scope.status = 'You cancelled the dialog.';
      });
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };


  $scope.createHw = function() {
    // Create Announcement
    $scope.hw.published_date = moment().unix();

    var updated = {
      "content": $scope.hw.content,
      "title": $scope.hw.title,
      "published_date": $scope.hw.published_date,
      "deadline": $scope.hw.published_date
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/task/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      _addHw($scope.hw);
      // Clean announ object
      $scope.task = {};
    }, function errorCallback(response) {});
    $mdDialog.cancel();
  }

  $scope.deleteAnnouncement = function(date) {
    $http({
      method: 'DELETE',
      url: '/api/v0/courses/task/' + $scope.id + "/" + $scope.section,
      data: {
        "published_date": parseInt(date)
      },
      headers: {'Content-Type': 'application/json' }
    }).then(function successCallback(response) {
      console.log(response);
      // Remove from element from DOM
      $('#' + date).remove();
    }, function errorCallback(response) {
      console.log(response);
    });
  }

}]);
