angular.module('SchoolApp').controller('CourseMaterialCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = $("#courseId").val();
  $scope.section = 1;

  $scope.material = {};
  $scope.materials = [];
  $scope.route = undefined;

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#materialBtn').click(function() {
    $scope.material = {};
    $scope.materials = [];
    $scope.route = undefined;
    $scope.getMaterial();
  });

  $scope.getMaterial = function() {
    $('#material-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/material/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      var dataList = response.data['material'];
      for (var material in dataList) {
        var draw = dataList[material];
        _addMaterial(draw, material);
        $scope.materials.push(draw);
      }
    }, function errorCallback(response) {});
  }


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
      '<tr class="md-row">' +
      '<td>' + mt.title + '</td>' +
      '<td>' + mt.content + '</td>' +
      '<td>' + "<img src='/static/images/design/travel.svg' width='50px'/>" + '</td>' +
      '<td>' +
      '<md-button class="md-raised button-eliminate md-primary" ng-click="downloadMaterial(\'' + mt.route + '\')">Descargar Material</md-button>' +
      '</td>' +
      '</tr>'
    )($scope));
  }

  $scope.downloadMaterial = function(route) {
    window.location.href = "/static/material/" + route;
  }
}]);
