angular.module('SchoolApp').controller('StudentAnnCtrl', ['$scope', '$http', '$compile',  function($scope, $http, $compile) {
  $scope.id =  parseInt($("#userId").val());
  $scope.levelRef = {
    "c1": "Primaria",
    "c2": "Secundaria",
    "c3": "Preparatoria",
    "c4": "Licenciatura"
  }

  $('#annuncesBtn').click(function() {
    $('#announcementCards').empty();
    $http({
      method: 'GET',
      url: '/api/v0/school/announcements/student',
      params: {"student_id": $scope.id}
    }).then(function successCallback(response) {
      var dataList = response.data['announcements'];
      for(var announ in dataList) {
        var drawAnnoun = dataList[announ];
        drawAnnoun.levelList = drawAnnoun.level;
        _addAnnouncement(drawAnnoun)
      }
    }, function errorCallback(response) {});
  });

  /*
   * This function compile javascript template
   * in order to generate an announcement on the DOM
   * @params -
   */
  function _addAnnouncement(announ) {
    var levels = "";
    for (var i in announ.levelList) {
      levels += $scope.levelRef[announ.levelList[i]] + " ";
    }
    var pDate = moment.unix(announ.publication_date).format("DD/MM/YYYY");

    // Compile to DOM
    angular.element(document.getElementById('announcementCards')).append($compile(
      '<md-card class="card-announ md-whiteframe-8dp" id='+ announ.publication_date +'>' +
      '<md-card-title>' +
      '<md-card-title-text>' +
      '<div class="row">' +
      '<div class="col-sm-8">' +
      '<h1 class="md-headline no-margin"> ' + announ.title + ' </h1>' +
      '<p class="md-subhead"> ' + announ.content + '</p>' +
      '<p class="md-subhead"> ' + levels + '</p>' +
      '</div>' +
      '<div class="col-sm-4"> '+
      '<div class="col-sm-4" style="height:25px;"><img  alt="." src="/static/images/calendar.svg" width="25px"></div>' +
      '<div class="col-sm-8"><p>'+ pDate +'</p></div>' +
      '</div>' +
      '</div>' +
      '</md-card-title-text> ' +
      '</md-card>'
    )($scope));
  }

}]);
