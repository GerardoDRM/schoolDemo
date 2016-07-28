angular.module('SchoolApp').controller('HomeController', ['$scope', '$http', function($scope, $http) {
  $scope.school = {}
  $scope.user = {}

  $http({
    method: 'GET',
    url: '/api/v0/school',
  }).then(function successCallback(response) {
    var schoolData = response.data;
    $scope.school = schoolData
    $scope.school.phone = schoolData.address.phone;
    $scope.school.address = schoolData.address.street;
    if ($scope.school.profile_photo !== undefined) {
      $("#schoolPhoto").css({
        "background": "url(\'" + $scope.school.profile_photo + "\')",
        "background-repeat": "no-repeat",
        "background-size": "cover"
      });
    }

    console.log($scope.school);
    // Select checkboxes
  }, function errorCallback(response) {});


  $scope.login = function() {
    $http({
      method: 'POST',
      url: '/api/v0/user/login',
      data: $scope.user
    }).then(function successCallback(response) {
      var data = response.data;
      if (data['code'] == 0) {
        addFeedback("Se ha presentado un incoveniente por favor vuelva a internar", "error");
      } else if (data['code'] == 1) {
        window.location.href = "/dash";
      } else if (data['code'] == 2) {
        addFeedback("Verifique que sus datos sean correctos", "error");
      }
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  };

}]);
