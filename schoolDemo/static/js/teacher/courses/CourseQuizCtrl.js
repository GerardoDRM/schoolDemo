angular.module('SchoolApp').controller('CourseQuizCtrl', ['$scope', '$compile', '$http', '$mdDialog', '$mdMedia', '$mdpTimePicker', function($scope, $compile, $http, $mdDialog, $mdMedia, $mdpTimePicker) {
  $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
  $scope.id = "MA101";
  $scope.section = 1;

  $scope.qz = {};
  $scope.quizes = [];
  $scope.position = undefined;

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
      '<md-button class="md-raised button-eliminate" ng-click="editQuiz(' + quiz + ', $ev)">Editar Quiz</md-button>' +
      '<md-button class="md-raised button-eliminate" ng-click="deleteQuiz(' + qz.published_date + ')">Eliminar Quiz</md-button>' +
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
      "start_date": moment($scope.qz.start_date).unix(),
      "start_hour": moment($scope.qz.start_hour).unix(),
      "end_date": moment($scope.qz.end_date).unix(),
      "end_hour": moment($scope.qz.end_hour).unix()
    }

    // console.log($scope.qz.start_date);
    // var x = moment().unix($scope.qz.start_date)
    // console.log(x);
    // console.log(moment.unix(x).format("DD/MM/YYYY"));

    // Check if is an update
    if ($scope.position !== undefined) {
      updated['position'] = $scope.position;
    }

    // Create Questions structure
    $scope.questionsArray = [];
    var object = $scope.questions;
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        $scope.questionsArray.push(object[key]);
      }
    }
    updated["questions"] = $scope.questionsArray;

    $http({
      method: 'POST',
      url: '/api/v0/courses/quiz/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      $('#quizBtn').click();
      addFeedback("Se ha creado el examen", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
    $mdDialog.cancel();
  }


  /*
    This methods create a question inside a Quiz structure
    this method also identify which question will be used
  */
  $scope._addSimpleQuestion = function() {
    var pos = $scope.questionCounter;

    angular.element(document.getElementById('qt-content')).append($compile(
      '<div class="container-questions" id="questionContainer' + pos + '">' +
      '<div class="row">' +
      '<div class="col-sm-12 questions">' +
      '<md-input-container class="md-block" flex>' +
      '<label>Pregunta</label>' +
      '<input ng-model="questions.q' + pos + '.question">' +
      '</md-input-container>' +
      '</div><div class="col-sm-4 questions">' +
      '<md-input-container class="md-block" flex>' +
      '<label>Porcentaje</label>' +
      '<input ng-model="questions.q' + pos + '.porcentage">' +
      '</md-input-container>' +
      '</div>' +
      '<md-button class="md-fab md-mini md-primary" aria-label="Delete">' +
      '<md-icon md-svg-src="/static/images/ic_delete_black.svg" ng-click="deleteQuestion(' + pos + ', $ev)"></md-icon></md-button>' +
      '</div></div>'
    )($scope));
    $scope.questions["q" + pos] = {};
    $scope.questions["q" + pos]["model"] = "simple";
    $scope.questionCounter++;
  }
  $scope._addMultipleQuestion = function() {
    var pos = $scope.questionCounter;

    angular.element(document.getElementById('qt-content')).append($compile(
      '<div class="container-questions" id="questionContainer' + pos + '">' +
      '<div class="row">' +
      '<div class="col-sm-12 questions">' +
      '<md-input-container class="md-block" flex>' +
      '<label>Pregunta</label>' +
      '<input ng-model="questions.q' + pos + '.question">' +
      '</md-input-container>' +
      '<div class="col-sm-12" id="multiple-space' + pos + '">' +
      '<div class="col-sm-6 questions">' +
      '<md-input-container class="multiple-opt">' +
      '<input ng-model="questions.q' + pos + '.op1" placeholder="Opcion">' +
      '</md-input-container></div>' +
      '<div class="col-sm-6 questions">' +
      '<md-input-container class="multiple-opt">' +
      '<input ng-model="questions.q' + pos + '.op2" placeholder="Opcion">' +
      '</md-input-container></div>' +
      '<div class="col-sm-6 questions">' +
      '<md-input-container class="multiple-opt">' +
      '<input ng-model="questions.q' + pos + '.op3" placeholder="Opcion">' +
      '</md-input-container></div>' +
      '<div class="col-sm-6 questions">' +
      '<md-input-container class="multiple-opt">' +
      '<input ng-model="questions.q' + pos + '.op4" placeholder="Opcion">' +
      '</md-input-container></div>' +
      '</div>' +
      '</div><div class="col-sm-4 questions">' +
      '<md-input-container class="md-block" flex>' +
      '<label>Porcentaje</label>' +
      '<input ng-model="questions.q' + pos + '.porcentage">' +
      '</md-input-container>' +
      '</div>' +
      '<md-button class="md-fab md-mini md-primary" aria-label="Delete">' +
      '<md-icon md-svg-src="/static/images/ic_delete_black.svg" ng-click="deleteQuestion(' + pos + ', $ev)"></md-icon></md-button>' +
      '<input ng-model="questions.q' + pos + '.model" type="hidden" value="multiple">' +
      '</div></div>'
    )($scope));
    $scope.questions["q" + pos] = {};
    $scope.questions["q" + pos]["model"] = "multiple";
    $scope.questionCounter++;
  }

  $scope._addBooleanQuestion = function() {
    var pos = $scope.questionCounter;
    angular.element(document.getElementById('qt-content')).append($compile(
      '<div class="container-questions" id="questionContainer' + pos + '">' +
      '<div class="row">' +
      '<div class="col-sm-12 questions">' +
      '<md-input-container class="md-block" flex>' +
      '<label>Pregunta</label>' +
      '<input ng-model="questions.q' + pos + '.question">' +
      '</md-input-container>' +
      '</div><div class="col-sm-4 questions">' +
      '<md-input-container class="md-block" flex>' +
      '<label>Porcentaje</label>' +
      '<input ng-model="questions.q' + pos + '.porcentage">' +
      '</md-input-container>' +
      '<md-radio-group ng-model="questions.q' + pos + '.boolean">' +
      '<md-radio-button value="true" class="md-primary">Verdadero</md-radio-button>' +
      '<md-radio-button value="false"> Falso </md-radio-button> ' +
      '</md-radio-group>' +
      '</div>' +
      '<md-button class="md-fab md-mini md-primary" aria-label="Delete">' +
      '<md-icon md-svg-src="/static/images/ic_delete_black.svg" ng-click="deleteQuestion(' + pos + ')"></md-icon></md-button>' +
      '<input ng-model="questions.q' + pos + '.model" type="hidden" value="boolean">' +
      '</div></div>'
    )($scope));
    $scope.questions["q" + pos] = {};
    $scope.questions["q" + pos]["model"] = "boolean";
    $scope.questionCounter++;
  }

  $scope._addRelationalQuestion = function() {
    angular.element(document.getElementById('qt-content')).append($compile(
      '<md-card>' +
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

  $scope._addMultipleOpt = function(pos) {
    angular.element(document.getElementById('multiple-space' + pos)).append($compile(
      '<input ng-model="qz.q' + pos + '.op">'
    )($scope));
  }

  $scope.deleteQuestion = function(pos) {
    $("#questionContainer" + pos).remove();
    delete $scope.questions["q" + pos];
  }

  // This method search on task array
  // this helps us a request to the server
  $scope.editQuiz = function(pos, ev) {
    var dataList = $scope.quizes;
    $scope.qz = dataList[pos];
    $scope.position = pos;

    // Create questions
    $scope.questions = [];
    var qt = $scope.qz["questions"];
    for (var i = 0; i < qt.length; i++) {
      switch (qt[i].model) {
        case "simple":
          $scope._addSimpleQuestion();
          break;
        case "multiple":
          $scope._addMultipleQuestion();
          break;
        case "boolean":
          $scope._addBooleanQuestion();
          break;
      }
      $scope.questions['q' + i] = qt[i];
    }

    $mdDialog.show({
      contentElement: '#CourseDialogQuiz',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true
    });
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
      $('#quizBtn').click();
      addFeedback("Se ha eliminado el examen", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

}]);
