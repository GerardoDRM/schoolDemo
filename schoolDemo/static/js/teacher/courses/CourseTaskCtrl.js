angular.module('SchoolApp').controller('CourseTaskCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;
  $scope.hw = {};
  $scope.tasks = [];
  $scope.position = undefined;

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#taskBtn').click(function() {
    $scope.hw = {};
    $scope.tasks = [];
    $scope.positon = undefined;
    $scope.getTasks();
  });

  $scope.getTasks = function() {
    $('#hw-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/task/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      var dataList = response.data['tasks'];
      for (var task in dataList) {
        var draw = dataList[task];
        $scope.tasks.push(draw);
        _addHw(draw, task);
      }
    }, function errorCallback(response) {});
  }

  var _addHw = function(hw, task) {
    var pDate = moment.unix(hw.published_date).format("DD/MM/YYYY");

    angular.element(document.getElementById('hw-content')).append($compile(
      '<md-card style="background:#E0E0E0">' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-8">' +
      '<h1 class="md-headline no-margin"> ' + hw.title + ' </h1>' +
      '<p  class="md-subhead">' + hw.model + '</p>' +
      '<p class="md-subhead"> ' + hw.content + '</p>' +
      '</div>' +
      '<div class="col-sm-4"> ' +
      '<div class="col-sm-4" style="height:25px;"><img  alt="." src="/static/images/calendar.svg" width="25px"></div>' +
      '<div class="col-sm-8"><p>' + pDate + '</p></div>' +
      '<md-button class="md-raised button-eliminate" ng-click="editTask(' + task + ', $ev)">Editar Tarea</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteTask(' + hw.published_date + ')">Eliminar Tarea</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

  $scope.showAdvanced = function(ev) {
    $scope.hw = {};
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
        contentElement: '#CourseDialogTask',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        fullscreen: useFullScreen
      })
      .then(function(answer) {}, function() {});
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      $scope.customFullscreen = (wantsFullScreen === true);
    });
  };


  $scope.createHw = function() {
    // Create Task
    $scope.hw.published_date = moment().unix();
    var updated = {
      "content": $scope.hw.content,
      "title": $scope.hw.title,
      "published_date": $scope.hw.published_date,
      "model": $scope.hw.model,
      "attachment": $scope.hw.attachment == true ? 1 : 0
    }

    // Check if is an update
    if ($scope.position !== undefined) {
      updated['position'] = $scope.position;
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/task/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      $('#taskBtn').click();
      addFeedback("Se ha creado la tarea", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
    $mdDialog.cancel();
  }

  // This method search on task array
  // this helps us a request to the server
  $scope.editTask = function(pos, ev) {
    var dataList = $scope.tasks;
    $scope.hw = dataList[pos]
    $scope.position = pos;
    $scope.hw.attachment = $scope.hw.attachment == 1 ? true : false;
    $mdDialog.show({
      contentElement: '#CourseDialogTask',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true
    });
  }

  $scope.deleteTask = function(date) {
    $http({
      method: 'DELETE',
      url: '/api/v0/courses/task/' + $scope.id + "/" + $scope.section,
      data: {
        "published_date": parseInt(date)
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      $('#taskBtn').click();
      addFeedback("Se ha eliminado la tarea", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

}]);
