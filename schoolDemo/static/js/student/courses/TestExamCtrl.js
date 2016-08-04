angular.module('SchoolApp').controller('TestExamCtrl', ['$scope', '$compile', '$http', function($scope, $compile, $http) {
  $scope.id = $("#courseId").val();
  $scope.section = 1;
  $scope.published_date = parseInt($("#examDate").val());
  $scope.qz = {};
  // Questions Array
  $scope.questionsArray = [];
  $scope.questionCounter = 0;
  $scope.questions = {};



  $scope.getQuiz = function() {
    // $('#quiz-content').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/quiz/info/' + $scope.id + "/" + $scope.section,
      params: {
        "published_date": $scope.published_date
      }
    }).then(function successCallback(response) {
      var dataList = response.data;
      $scope.qz = response.data;
      $scope.qz.start_date = moment.unix($scope.qz.start_date).format("DD/MM/YYYY");
      $scope.qz.end_date = moment.unix($scope.qz.end_date).format("DD/MM/YYYY");
      $scope.qz.start_hour = moment.unix($scope.qz.start_hour).format("hh:mm");
      $scope.qz.end_hour = moment.unix($scope.qz.end_hour).format("hh:mm");
      // Add Questions
      _addQuestions($scope.qz.questions);
    }, function errorCallback(response) {});
  }

  $scope.getQuiz();

  var _addQuestions = function(qt) {
    for (var i = 0; i < qt.length; i++) {
      $scope.questions['q' + i] = qt[i];
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
    }
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
      '<h4>Pregunta</h4>' +
      '<p>' +
      $scope.questions['q' + pos]['question'] +
      '</p>' +
      '</div><div class="col-sm-4 questions">' +
      '<h4>Puntos</h4>' +
      '<p>' +
      $scope.questions['q' + pos]['porcentage'] +
      '</p>' +
      '</div>' +
      '</div></div>'
    )($scope));
    $scope.questionCounter++;
  }
  $scope._addMultipleQuestion = function() {
    var pos = $scope.questionCounter;

    angular.element(document.getElementById('qt-content')).append($compile(
      '<div class="container-questions" id="questionContainer' + pos + '">' +
      '<div class="row">' +
      '<div class="col-sm-12 questions">' +
      '<h4>Pregunta</h4>' +
      '<p>' +
      $scope.questions['q' + pos]['question'] +
      '</p>' +
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
      '<h4>Porcentaje</h4>' +
      '<p>' +
      $scope.questions['q' + pos]['porcentage'] +
      '</p>' +
      '</div>' +
      '<input ng-model="questions.q' + pos + '.model" type="hidden" value="multiple">' +
      '</div></div>'
    )($scope));
    $scope.questionCounter++;
  }

  $scope._addBooleanQuestion = function() {
    var pos = $scope.questionCounter;
    angular.element(document.getElementById('qt-content')).append($compile(
      '<div class="container-questions" id="questionContainer' + pos + '">' +
      '<div class="row">' +
      '<div class="col-sm-12 questions">' +
      '<h4>Pregunta</h4>' +
      '<p>' +
      $scope.questions['q' + pos]['question'] +
      '</p>' +
      '</div><div class="col-sm-4 questions">' +
      '<h4>Porcentaje</h4>' +
      '<p>' +
      $scope.questions['q' + pos]['porcentage'] +
      '</p>' +
      '<md-radio-group ng-model="questions.q' + pos + '.boolean">' +
      '<md-radio-button value="true" class="md-primary">Verdadero</md-radio-button>' +
      '<md-radio-button value="false"> Falso </md-radio-button> ' +
      '</md-radio-group>' +
      '</div>' +
      '<input ng-model="questions.q' + pos + '.model" type="hidden" value="boolean">' +
      '</div></div>'
    )($scope));
    $scope.questionCounter++;
  }

}]);
