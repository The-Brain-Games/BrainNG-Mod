angular.module('beamng.stuff')

.directive('animatedIcon', [function () {
  return {
    template: '<div class="icon" layout-align="center center"><img class="iconImg"></div>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      scope.$watch('data', function() {
        element[0].querySelector('img').src = "modules/loading/icon_" + attrs.icon + ".svg";
        if(scope.data !== undefined) {
          var percent = scope.data.iconState[attrs.icon.toUpperCase()] || 0;
          element[0].style.backgroundPosition = '0 ' + (percent)  + '%';
        }
      });
    }
  }
}])


.directive('animatedProgressBar', [function () {
  return {
    template: '<div class="progressBarBackground" layout="column" layout-align="center center"><div class="progressBarForeground" layout="column" layout-align="center end"></div><div class="progressBarPercentText"></div></div>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      scope.$watch('data', function() {
        var pr = element[0].querySelector('.progressBarForeground');
        var prText = element[0].querySelector('.progressBarPercentText');
        if(scope.data !== undefined) {
          if(scope.data.currentEntries.length > 0) {
            var p = scope.data.currentEntries[0].progress;
            pr.style.left = '-' + (100 - p)  + '%';
            prText.innerHTML = Math.round(p)  + '%';
          } else {
            // 0 = full bar, -100% = empty
            pr.style.left = '0';
            prText.innerHTML = '';
          }
        }
      });
    }
  }
}])


.directive('animatedProgressStatus', [function () {
  return {
    template: '<div class="progressStatus" layout-align="center center"></div>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      scope.$watch('data', function() {
        if(scope.data !== undefined) {
          if(scope.data.currentEntries.length > 0) {
            element[0].innerHTML = scope.data.currentEntries[0].message;
          } else {
            element[0].innerHTML = '';
          }
        }
      });
    }
  }
}])

.directive('animatedProgressStatusHistory', [function () {
  return {
    template: '<div class="progressStatusHistory" layout-align="center center"><div ng-repeat="item in data.historyEntriesDisplay">{{item.message}}</div></div>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
    }
  }
}])

.directive('tipsBar', [function () {
  return {
    template: '<div class="tipsBar" layout-align="begin begin" layout="row" ><div class="tipsBarTitle">TIPS:</div><div class="tipsBarTip" bng-translate="{{ ::hintTranslationKey }}"></div></div>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      /*
      var pr = element[0].querySelector('.tipsBarTip');
      pr.innerHTML = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation';
      */
    }
  }
}])


.controller('LoadingController', ['bngApi', 'logger', '$scope', 'ControlsUtils', 'Hints', 'Utils',
  function (bngApi, logger, $scope, ControlsUtils, Hints, Utils) {

  var vm = this;
  $scope.hintTranslationKey = Hints[Math.floor(Math.random() * Hints.length)];

  var sampleData = {
    "currentEntries": [
      {
        "name": "Terrain",
        "message": "Loading Terrain",
        "progress": 75.122133,
        "timeTaken": 0.0000010999999631167157
      },
      {
        "name": "Terrain",
        "message": "Loading Something else",
        "progress": 10.21341234,
        "timeTaken": 0.005
      }
    ],
    "historyEntries": [
      {
        "name": "Base",
        "message": "Base: loaded 345 objects",
        "timeTaken": 0.0661884993314743
      },
      {
        "name": "Terrain2",
        "message": "Base: loaded 345 objects",
        "timeTaken": 0.0661884993314743
      },
      {
        "name": "Forest",
        "message": "Base: loaded 345 objects",
        "timeTaken": 0.0661884993314743
      },
      {
        "name": "Base",
        "message": "Base: loaded 345 objects",
        "timeTaken": 0.0661884993314743
      }

    ]
  };

  function updateData(data) {
    //console.log(data);
    $scope.data = {};
    $scope.data.historyEntries = data.historyEntries;
    $scope.data.historyEntriesDisplay = data.historyEntries.slice(Math.max( data.historyEntries.length -3, 1));
    $scope.data.currentEntries = data.currentEntries; //.slice(0, 2);
    // optimize data layout for our usecase
    $scope.data.iconState = {};
    for(var i = 0; i < data.currentEntries.length; i++) {
      $scope.data.iconState[data.currentEntries[i].name.toUpperCase()] = data.currentEntries[i].progress;
    }
    for(var i = 0; i < data.historyEntries.length; i++) {
      $scope.data.iconState[data.historyEntries[i].name.toUpperCase()] = 100;
    }
  }
  //updateData(sampleData);

  $scope.$on('UpdateLoadingProgressV2', function (event, data) {
    window.requestAnimationFrame(function () {
      //console.log(data);
      $scope.$apply(function () {
        updateData(data);
      });
    });
    $scope.$digest();
  });

  bngApi.engineLua('sailingTheHighSeas', (val) => {
    $scope.sailingTheHighSeas = val
  });

  bngApi.engineLua(`dirContent("game:/ui/modules/loading/${beamng.product}/")`, (data) => {
    var files = data.map((elem) => elem.slice('/ui/'.length + (elem.indexOf("game:")==0?'game:'.length:0)));
    var file = files[Utils.random(0, files.length -1, true)];
    if ($scope.sailingTheHighSeas === true) {
      file = "modules/mainmenu/unofficial_version.jpg"
    }
    $scope.$evalAsync(() => {
      vm.img = file;
      // give angualar a head start to finish running it's digest
      setTimeout(function () {
        // since background images don't fire a load event, we'll simulate one
        var a = new Image();
        a.onload = function () {
          // give the render a head start (ie. wait 2-3 frames)
          Utils.waitForCefAndAngular(() => {
            bngApi.engineLua('core_gamestate.loadingScreenActive()');
          });
        }
        a.src = file;
      });
    });
  });

  // no infinite loading screen
  var timeout = setTimeout(() => bngApi.engineLua('core_gamestate.loadingScreenActive()'), 10000);

  $scope.$on('$destroy', function () {
    clearTimeout(timeout)
  });
}]);
