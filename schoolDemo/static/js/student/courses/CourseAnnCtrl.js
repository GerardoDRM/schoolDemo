angular.module('SchoolApp').controller('CourseAnnCtrl', ['$scope', '$http', '$compile', function($scope, $http, $compile) {
  $scope.id = "MA101";
  $scope.section = 1;

  $scope.announ = {};

  $('#annuncesBtn').click(function() {
    $scope.announ = {};
    $scope.displayAnnoun();
  });

  $scope.displayAnnoun = function() {
    $('#comment-space').empty();
    $http({
      method: 'GET',
      url: '/api/v0/courses/announ/' + $scope.id + "/" + $scope.section
    }).then(function successCallback(response) {
      var dataList = response.data['announcements'];
      for (var announ in dataList) {
        var drawAnnoun = dataList[announ];
        _addAnnouncement(drawAnnoun);
      }
    }, function errorCallback(response) {});
  }

  // Get announcements
  $scope.displayAnnoun();

  /*
   * This function compile javascript template
   * in order to generate an announcement on the DOM
   * @params - announ
   */
  function _addAnnouncement(announ) {
    var pDate = moment.unix(announ.date).format("DD/MM/YYYY");
    // Compile to DOM
    angular.element(document.getElementById('comment-space')).append($compile(
      '<md-list-item class="md-3-line" style="height:250px;">' +
      '<div class="list-item-txt">' +
      '<h3>' + announ.author + '</h3>' +
      '<h4>' + pDate + '</h4>' +
      '<p>' + announ.description +
      '</p>' +
      '</div>' +
      '<md-divider inset></md-divider>' +
      '</md-list-item>'
    )($scope));
  }

  $scope.createAnnouncement = function() {
    // Create Announcement
    $scope.announ.author = "Lucas";
    $scope.announ.date = moment().unix();

    var updated = {
      "author": $scope.announ.author,
      "description": $scope.announ.description,
      "date": $scope.announ.date,
      "role": "student"
    }

    $http({
      method: 'POST',
      url: '/api/v0/courses/announ/' + $scope.id + "/" + $scope.section,
      data: updated
    }).then(function successCallback(response) {
      addFeedback("Se ha agregado el comentario al muro", 'success');
      $('#annuncesBtn').click();
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

  $scope.deleteAnnouncement = function(date) {
    $http({
      method: 'DELETE',
      url: '/api/v0/courses/announ/' + $scope.id + "/" + $scope.section,
      data: {
        "publication_date": parseInt(date)
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      // Remove from element from DOM
      $('#annuncesBtn').click();
      addFeedback("Se ha eliminado el comentario del muro", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

}]);
