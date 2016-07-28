angular.module('SchoolApp').controller('CourseTaskCtrl', ['$scope', '$compile', '$http','$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;
  $scope.hw = {};
  $scope.tasks = [];

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#taskBtn').click(function() {
    $scope.hw = {};
    $scope.tasks = [];
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
      '<md-button class="md-raised button-eliminate" ng-click="editTask(' + task + ', $ev)">Subir Tarea</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }
}]);
