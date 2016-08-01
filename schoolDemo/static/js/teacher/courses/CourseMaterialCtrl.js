angular.module('SchoolApp').controller('CourseMaterialCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;

  $scope.material = {};
  $scope.materials = [];
  $scope.position = undefined;
  $scope.route = undefined;
  $scope.edition = undefined;

  $scope.package = {
    file: ''
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#materialBtn').click(function() {
    $scope.material = {};
    $scope.materials = [];
    $scope.position = undefined;
    $scope.route = undefined;
    $scope.edition = undefined;
    $scope.package = {
      file: ''
    };
    $scope.getMaterial();
  });

  $scope.getMaterial = function() {
    $('#material-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/material/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      $("#updateFileBtn").css({
        "display": "none"
      });
      var dataList = response.data['material'];
      for (var material in dataList) {
        var draw = dataList[material];
        _addMaterial(draw, material);
        $scope.materials.push(draw);
      }
    }, function errorCallback(response) {});
  }

  $scope.showAdvancedMaterial = function(ev) {
    $scope.material = {};
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
        contentElement: '#CourseDialogMaterial',
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


  $scope.openMenu = function($mdOpenMenu, ev) {
    originatorEv = ev;
    $mdOpenMenu(ev);
  };

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  var _addMaterial = function(mt, material) {
    // Compile to DOM
    angular.element(document.getElementById('material-content')).append($compile(
      '<tr>' +
      '<td>' + mt.title + '</td>' +
      '<td>' + mt.content + '</td>' +
      '<td>' + "Material" + '</td>' +
      '<td>' +
      '<md-button class="md-raised button-eliminate" ng-click="editMaterial(' + material + ', $ev)">Editar Recurso</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteMaterial(' + mt.published_date + ', \''+ mt.route +'\')">Eliminar Recurso</md-button>' +
      '</td>' +
      '</tr>'
    )($scope));
  }

  $scope.createMaterial = function() {

    // Create Announcement
    $scope.material.published_date = moment().unix();

    var updated = {
      "content": $scope.material.content,
      "title": $scope.material.title,
      "published_date": $scope.material.published_date
    }

    // Check if is an update
    if ($scope.position !== undefined) {
      updated['position'] = $scope.position;
    }

    if ($scope.package.file !== undefined && $scope.package.file != "") {
      updated['file'] = $scope.package.file;
    }

    if ($scope.edition !== undefined) {
      updated['edition'] = $scope.edition;
      updated['file_name'] = $scope.route;
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/material/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      $('#materialBtn').click();
      addFeedback("Se ha creado el material de clase", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
    $mdDialog.cancel();
  }

  // This method search on task array
  // this helps us a request to the server
  $scope.editMaterial = function(pos, ev) {
    var dataList = $scope.materials;
    $scope.material = dataList[pos];
    $scope.position = pos;
    $scope.route = $scope.material.route;
    if ($scope.route !== undefined && $scope.route != "") {
      $("#file").attr("disabled", true);
      $("#updateFileBtn").css({
        "display": "block"
      });
    }
    $scope.edition = 0;

    $mdDialog.show({
      contentElement: '#CourseDialogMaterial',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true
    });
  }

  $scope.updateFile = function() {
    $("#file").attr("disabled", false);
    $scope.edition = 1;
    $("#updateFileBtn").css({
      "display": "none"
    });
  }


  $scope.deleteMaterial = function(date, name) {
    $http({
      method: 'DELETE',
      url: '/api/v0/courses/material/' + $scope.id + "/" + $scope.section,
      data: {
        "published_date": parseInt(date),
        "file_name": name
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      $('#materialBtn').click();
      addFeedback("Se ha eliminado el material de clase", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }


}]);
