angular.module('SchoolApp').controller('CourseMaterialCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;

  $scope.material = {};
  $scope.materials = [];

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#materialBtn').click(function() {
    $scope.material = {};
    $scope.materials = [];
    $scope.getMaterial();
  });

  $scope.getMaterial = function() {
    $('#material-content').empty();
    // $http({
    //   method: 'GET',
    //   url: '/api/v0/courses/quiz/' + $scope.id + "/" + $scope.section
    // }).then(function successCallback(response) {
    //   var dataList = response.data['quiz'];
    //   for (var quiz in dataList) {
    //     var draw = dataList[quiz];
    //     _addQz(draw, quiz);
    //     draw.start_date = new Date(draw.start_date * 1000);
    //     draw.end_date = new Date(draw.end_date * 1000);
    //     draw.start_hour = new Date(draw.start_hour * 1000);
    //     draw.end_hour = new Date(draw.end_hour * 1000);
    //     $scope.quizes.push(draw);
    //   }
    }, function errorCallback(response) {});
  }

  $scope.showAdvancedQuiz = function(ev) {
    $scope.qz = {};
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
        contentElement: '#CourseDialogQuiz',
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

  var _addMaterial = function(qz, quiz) {
    angular.element(document.getElementById('quiz-content')).append($compile(
      '<md-card style="background:#E0E0E0">' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-7">' +
      '<h1 class="md-headline no-margin"> ' + qz.title + ' </h1>' +
      '<p class="md-subhead"> ' + qz.content + '</p>' +
      '<p class="md-subhead"> Preguntas: ' + numQuestions + ' </p>' +
      '</div>' +
      '<div class="col-sm-5"> ' +
      '<div class="col-sm-3" style="height:25px;"><img  alt="." src="/static/images/calendar.svg" width="25px"></div>' +
      '<div class="col-sm-9"><p>Creacion: ' + pDate + '</p><p>Comienza: ' + completeSDate + '</p><p>Termina: ' + completeEDate + '</p></div>' +
      '<md-button class="md-raised button-eliminate">Contestar</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

}]);
