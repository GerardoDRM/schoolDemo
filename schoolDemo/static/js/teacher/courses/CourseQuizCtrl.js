angular.module('SchoolApp').controller('CourseQuizCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', function($scope, $compile, $http, $mdDialog, $mdMedia) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;

  $scope.qz = {};

  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $('#quizBtn').click(function() {
    $('#quiz-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/quiz/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      console.log(response.data);
      var dataList = response.data['quiz'];
      for (var task in dataList) {
        var draw = dataList[task];
        _addQz(draw);
      }
    }, function errorCallback(response) {});
  });

  $scope.showAdvancedQuiz = function(ev) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
    $mdDialog.show({
        contentElement: '#CourseDialogQuiz',
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


  $scope.openMenu = function($mdOpenMenu, ev) {
    originatorEv = ev;
    $mdOpenMenu(ev);
  };

  $scope.createQuestion = function() {
    angular.element(document.getElementById('qt-content')).append($compile(
      '<md-card style="background:#E0E0E0">' +
      '<md-card-title-text>' +
      '<div layout="column">' +
      '<md-input-container class="md-block" flex>' +
      '<label>Pregunta</label>' +
      '<input ng-model="hw.q1.q">' +
      '</md-input-container>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }
  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  var _addQz = function(qz) {
    var pDate = moment.unix(qz.published_date).format("DD/MM/YYYY");

    angular.element(document.getElementById('quiz-content')).append($compile(
      '<md-card style="background:#E0E0E0">' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-8">' +
      '<h1 class="md-headline no-margin"> ' + qz.title + ' </h1>' +
      '<p class="md-subhead"> ' + qz.content + '</p>' +
      '<p class="md-subhead"> 1 pregunta </p>' +
      '</div>' +
      '<div class="col-sm-4"> ' +
      '<div class="col-sm-4" style="height:25px;"><img  alt="." src="/static/images/calendar.svg" width="25px"></div>' +
      '<div class="col-sm-8"><p>' + pDate + '</p></div>' +
      '<md-button class="md-raised button-eliminate" ng-click="editQuiz()">Editar Quiz</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteQuiz()">Eliminar Quiz</md-button>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }


  $scope.createQz = function() {
    // Create Announcement
    $scope.qz.published_date = moment().unix();

    var updated = {
      "content": $scope.qz.content,
      "title": $scope.qz.title,
      "published_date": $scope.qz.published_date,
      "deadline": $scope.qz.published_date,
      "accesstime": $scope.qz.published_date
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/quiz/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      _addQz($scope.qz);
      // Clean announ object
      $scope.qz = {};
    }, function errorCallback(response) {});
    $mdDialog.cancel();
  }

  $scope.deleteQuiz = function(date) {
    $http({
      method: 'DELETE',
      url: '/api/v0/courses/quiz/' + $scope.id + "/" + $scope.section,
      data: {
        "published_date": parseInt(date)
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      console.log(response);
      // Remove from element from DOM
      $('#' + date).remove();
    }, function errorCallback(response) {
      console.log(response);
    });
  }

}]);
