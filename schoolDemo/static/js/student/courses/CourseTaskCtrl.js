angular.module('SchoolApp').controller('CourseTaskCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;
  $scope.hw = {};
  $scope.tasks = [];
  $scope.edition = undefined;
  $scope.student = 1000;
  $scope.attachmentsArray = [];

  $scope.package = {
    file: ''
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#taskBtn').click(function() {
    $scope.hw = {};
    $scope.tasks = [];
    $scope.edition = undefined;
    $scope.package = {
      file: ''
    };
    $scope.attachmentsArray = [];
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
        // Check hw attachments
        $scope.attachmentsArray.push(draw.attachments);
        // Add to UI
        _addHw(draw, task);
      }
    }, function errorCallback(response) {});
  }


  $scope.uploadFile = function(pos) {
    var updated = {
      "position_task": parseInt(pos),
      "student": $scope.student
    }

    // Check if is an update
    _getAttachRef(pos);
    if ($scope.position !== undefined) {
      updated['position_attach'] = $scope.position;
    }

    if ($scope.package.file !== undefined && $scope.package.file != "") {
      updated['file'] = $scope.package.file;
    } else {
      addFeedback("Es necesario cargar un archivo", 'error');
      return;
    }

    if ($scope.edition !== undefined) {
      updated['edition'] = $scope.edition;
      updated['file_name'] = $scope.route;
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/task/attach/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      $('#materialBtn').click();
      addFeedback("Se ha cargado el archivo correctamente", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }


  $scope.deleteFile = function(pos) {
    console.log(pos);
    var updated = {
      "position_task": parseInt(pos),
      "student": $scope.student,
      "edition": 1
    }

    // Check if is an update
    var tmpAttach = $scope.attachmentsArray[pos];
    if (tmpAttach !== undefined) {
      for (var i = 0; i < tmpAttach.length; i++) {
        if (tmpAttach[i]['student'] == $scope.student) {
          updated['position_attach'] = i;
          updated['file_name'] = tmpAttach[i]['url'];
          break;
        }
      }
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/task/attach/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      $('#materialBtn').click();
      addFeedback("Se ha cargado el archivo correctamente", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

  var _addHw = function(hw, pos) {
    var pDate = moment.unix(hw.published_date).format("DD/MM/YYYY");

    var updateTemplate = '<md-button ng-click="uploadFile(' + pos + ')" id="uploadFileBtn">' +
      'Subir Archivo' +
      '</md-button>';

    var deleteTemplate = '<md-button ng-click="deleteFile(' + pos + ')" id="updateFileBtn">' +
      'Eliminar Archivo' +
      '</md-button>';

    var btnTemplate = _checkAttach(pos) ? deleteTemplate : updateTemplate;
    // Check if student can attach a hw
    var template = '<md-input-container class="md-icon-float md-block">' +
      'Agregar archivo' +
      '<md-icon md-svg-src="/static/images/ic_attachment.svg" class="material-icons step" aria-label="attachment">' +
      '</md-icon>' +
      '<input type="file" fileread ng-model="route" id="file">' +
      '</md-input-container>' +
      btnTemplate;


    var attachment = hw.attachment == 1 ? template : "";

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
      attachment +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

  var _checkAttach = function(pos) {
    var tmpAttach = $scope.attachmentsArray[pos];
    if (tmpAttach !== undefined) {
      for (var i = 0; i < tmpAttach.length; i++) {
        if (tmpAttach[i]['student'] == $scope.student && tmpAttach[i]['url'] != "") {
          return true;
        }
      }
    }

  }

  var _getAttachRef = function(pos) {
    var tmpAttach = $scope.attachmentsArray[pos];
    if (tmpAttach !== undefined) {
      for (var i = 0; i < tmpAttach.length; i++) {
        if (tmpAttach[i]['student'] == $scope.student) {
          $scope.position = i;
          $scope.edition = 0;
          break;
        }
      }
    }

  }

}]);
