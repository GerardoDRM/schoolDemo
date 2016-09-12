angular.module('SchoolApp').controller('CourseTaskCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', '$mdpTimePicker', function($scope, $compile, $http, $mdDialog, $mdMedia, $mdpTimePicker) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = $("#courseId").val();
  $scope.section = 1;
  $scope.hw = {};
  $scope.tasks = [];
  $scope.position = undefined;
  var modelDict = {
    "homework": "Tarea",
    "project": "Proyecto",
    "participation": "Participación",
    "extras": "Extras"
  }

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
        _addHw(draw, task);
        if (draw.end_date !== undefined && draw.end_date != "") {
          draw.end_date = new Date(draw.end_date * 1000);
          draw.end_hour = new Date(draw.end_hour * 1000);
        } 
        $scope.tasks.push(draw);
      }
    }, function errorCallback(response) {});
  }

  $scope.goToTask = function(date, pos) {
    window.location.href = "/teacher/class/" + $scope.id + "/task/" + pos + "/" + date;
  }

  var _addHw = function(hw, task) {
    var button = '<md-button class="md-raised md-primary button-eliminate" ng-click="goToTask(' + hw.published_date + ',' + task + ')">Ver Tareas</md-button>';
    var attach = hw.attachments.length > 0 ? button : "";
    var pDate = moment.unix(hw.published_date).format("DD/MM/YYYY");

    var completeDueDate = "";

    if (hw.end_date !== undefined && hw.end_date != "") {
      var eDate = moment.unix(hw.end_date).format("DD/MM/YYYY");
      var eHour = moment.unix(hw.end_hour).format("hh:mm");
      completeDueDate = eDate + " " + eHour;
    } else {
      completeDueDate = "No hay limite";
    }

    angular.element(document.getElementById('hw-content')).append($compile(
      '<md-card style="background:#E0E0E0">' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-8">' +
      '<h1 class="md-headline no-margin"> ' + hw.title + ' </h1>' +
      '<p  class="md-subhead">' + modelDict[hw.model] + '</p>' +
      '<p  class="md-subhead"> Fecha de publicacion: ' + pDate + '</p>' +
      '<p  class="md-subhead"> Fecha de entrega: ' + completeDueDate + '</p>' +
      '<p class="md-subhead"> ' + hw.content + '</p>' +
      '</div>' +
      '<div class="col-sm-4"> ' +
      attach +
      '<md-button class="md-raised button-eliminate" ng-click="editTask(' + task + ', $ev)">Editar Tarea</md-button>' +
      '<md-button class="md-raised button-eliminate md-warn" ng-click="deleteTask(' + hw.published_date + ')">Eliminar Tarea</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '<div class="icon-corner"><img src="/static/images/design/notepad.svg" /></div>' +
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

    if ($scope.hw.end_date !== undefined && $scope.hw.end_hour !== undefined) {
      updated["end_date"] = moment($scope.hw.end_date).unix();
      updated["end_hour"] = moment($scope.hw.end_hour).unix();
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
