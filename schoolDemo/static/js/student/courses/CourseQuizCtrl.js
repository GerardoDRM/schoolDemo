angular.module('SchoolApp').controller('CourseQuizCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = $("#courseId").val();
  $scope.section = 1;

  $scope.qz = {};
  $scope.quizes = [];

  // Questions Array
  $scope.questionsArray = [];
  $scope.questionCounter = 0;
  $scope.questions = {};

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#quizBtn').click(function() {
    $scope.qz = {};
    $scope.quizes = [];
    $scope.position = undefined;
    $scope.questionCounter = 0;
    $scope.questionsArray = [];
    $scope.questions = {};
    $scope.getQuiz();
  });

  $scope.getQuiz = function() {
    $('#quiz-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/quiz/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      var dataList = response.data['quiz'];
      for (var quiz in dataList) {
        var draw = dataList[quiz];
        _addQz(draw, quiz);
        draw.start_date = new Date(draw.start_date * 1000);
        draw.end_date = new Date(draw.end_date * 1000);
        draw.start_hour = new Date(draw.start_hour * 1000);
        draw.end_hour = new Date(draw.end_hour * 1000);
        $scope.quizes.push(draw);
      }
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

  $scope.goToQuiz = function(date) {
    window.location.href = "/student/class/" + $scope.id + "/exam/" + date;
  }

  var _addQz = function(qz, quiz) {
    var pDate = moment.unix(qz.published_date).format("DD/MM/YYYY");
    var sDate = moment.unix(qz.start_date).format("DD/MM/YYYY");
    var eDate = moment.unix(qz.end_date).format("DD/MM/YYYY");
    var sHour = moment.unix(qz.start_hour).format("hh:mm");
    var eHour = moment.unix(qz.end_hour).format("hh:mm");

    var completeSDate = sDate + " " + sHour;
    var completeEDate = eDate + " " + eHour;

    var numQuestions = qz.questions.length;

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
      '<md-button class="md-raised md-primary" ng-click="goToQuiz(' + qz.published_date + ')">Contestar</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

}]);
