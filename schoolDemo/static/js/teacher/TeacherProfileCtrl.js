angular.module('SchoolApp').controller('TeacherProfileCtrl', ['$scope', '$http', '$compile', function($scope, $http, $compile) {
  $scope.id = parseInt($("#userId").val());
  $scope.profile = {};
  $scope.photo = {
    file: ''
  };
  $scope.route = undefined;

  $('#profileBtn').click(function() {
    $scope.profile = {};
    $scope.route = undefined;
    $scope.photo = {
      file: ''
    };
    $scope.getProfile();
  });

  $scope.getProfile = function() {
    $http({
      method: 'GET',
      url: '/api/v0/teacher/profile/' + $scope.id
    }).then(function successCallback(response) {
      $scope.profile = response.data;
      $scope.profile.id = $scope.id;

      // Check btn for teacher photo
      if ($scope.profile.image === undefined || $scope.profile.image == "") {
        $("#btnAddPhoto").css({
          "display": "block"
        });
        $("#btnDeletePhoto").css({
          "display": "none"
        });
      } else {
        $("#btnAddPhoto").css({
          "display": "none"
        });
        $("#btnDeletePhoto").css({
          "display": "block"
        });
        $scope.route = $scope.profile.image;
        $("#teacher_photo").css({
          "background": "url(/static/teachers/"+ $scope.route +") 50% 50% / cover no-repeat"
        });
      }

    }, function errorCallback(response) {});
  }

  $scope.getProfile();

  $scope.storeProfile = function() {
    var data = {
      "email": $scope.profile.email,
      "phone": $scope.profile.phone,
      "password": $scope.profile.password
    };
    $http({
      method: 'PUT',
      url: '/api/v0/teacher/profile/' + $scope.id,
      data: data
    }).then(function successCallback(response) {
      addFeedback("Se han guardado los datos exitosamente", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }

  /**
  Function to store teacher photo on database
  **/
  $scope.storePhoto = function() {
      $http({
        method: 'POST',
        url: '/api/v0/teacher/profile/photo/' + $scope.id,
        data: {
          "file": $scope.photo.file
        }
      }).then(function successCallback(response) {
        $scope.getProfile();
        addFeedback("Se han guardado la foto exitosamente", 'success');
      }, function errorCallback(response) {
        addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
      });
    }
    /**
    Function to delete teacher photo on database
    **/
  $scope.deletePhoto = function() {
    $http({
      method: 'DELETE',
      url: '/api/v0/teacher/profile/photo/' + $scope.id,
      data: {
        "image": $scope.route
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function successCallback(response) {
      $scope.getProfile();
      $("#teacher_photo").css({
        "background": "url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMzAgMzAiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDMwIDMwIiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIGZpbGw9IiNCMkJBQzIiIGQ9Ik04LjksNy40YzAtMy40LDEtNy41LDYuMS03LjVjNS40LDAsNi4xLDQsNi4xLDcuNEwyMC45LDExYzAsMy40LTMuNiw1LjMtNS45LDUuM2MtMiwwLTUuOS0xLjktNS45LTUuMw0KCUw4LjksNy40eiIvPg0KPHBhdGggZmlsbD0iI0IyQkFDMiIgZD0iTTE2LjQsMTguOWgtMi43QzYuMSwxOC45LDAsMjIuNSwwLDMwbDAsMGgzMGwwLDBDMzAsMjIuNSwyMy45LDE4LjksMTYuNCwxOC45eiIvPg0KPC9zdmc+DQo=) 50% 50% / cover no-repeat"
      });
      addFeedback("Se ha borrado la foto exitosamente", 'success');
    }, function errorCallback(response) {
      addFeedback("Se ha presentado un error, por favor vuelva a intentarlo", 'error');
    });
  }
}]);
