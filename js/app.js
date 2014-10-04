/**
* myApp Module
*
* Simple Chrome Weather App
*/
angular.module('myApp', ['ngRoute'])
	.provider('Weather', function(){
		var apiKey = "";

		this.getUrl = function(type, ext) {
		  return "http://api.wunderground.com/api/" +
		    this.apiKey + "/" + type + "/q/" +
		    ext + '.json';
		};

		this.setApiKey = function(key){
			if(key) this.apiKey = key;
		};

		this.$get = function($q, $http){
			var self = this;
			return{
				getWeatherForecast: function(city) {
			      var d = $q.defer();
			      $http({
			        method: 'GET',
			        url: self.getUrl("forecast", city),
			        cache: true
			      }).success(function(data) {
			        // The wunderground API returns the
			        // object that nests the forecasts inside
			        // the forecast.simpleforecast key
			        console.log(data);
			        console.log(data.forecast.simpleforecast.forecastday[0].icon);
			        d.resolve(data.forecast.simpleforecast);
			      }).error(function(err) {
			        d.reject(err);
			      });
			      return d.promise;
			    },
			    getCityDetails: function(query) {
			      var d = $q.defer();
			      $http({
			        method: 'GET',
			        url: "http://autocomplete.wunderground.com/aq?query=" +
			              query
			      }).success(function(data) {
			        d.resolve(data.RESULTS);
			        console.log(data);
			      }).error(function(err) {
			        d.reject(err);
			      });
			      return d.promise;
			    }
			}
		}
	})
	.factory('UserService', function(){
		var defaults = {
			location: 'Toronto, Canada'
		};
		var service = {
			user: {},
			save: function(){
				sessionStorage.climax = angular.toJson(service.user);
			},
			restore: function(){
				//Pull from sessionStorage
				service.user = angular.fromJson(sessionStorage.climax) || defaults;

				return service.user;
			}
		};
		// Immediately call restore from the session storage
		// so we have our user data available immediately
		service.restore();
		return service;
	})
	.config(function(WeatherProvider) {
		WeatherProvider.setApiKey('edce8d7f316b6fe4');
	})
	.config(['$routeProvider', function($routeProvider){
		$routeProvider
			.when('/', {
				templateUrl: 'templates/home.html',
				controller: 'MainController'
			})
			.when('/settings', {
				templateUrl: 'templates/settings.html',
				controller: 'SettingsController'
			})
			.otherwise({redirectTo: '/'});
	}])
	.directive('autoFill', function($timeout, Weather) {
	  return {
	    restrict: 'EA',
	    scope: {
	      autoFill: '&',
	      ngModel: '=',
	      timezone: '='
	    },
	    compile: function(tEle, tAttrs) {
	      var tplEl = angular.element('<div class="typeahead">' +
	      '<input type="text" autocomplete="off" />' +
	      '<ul id="autolist" ng-show="reslist">' +
	        '<li ng-repeat="res in reslist" ' +
	          '>{{res.name}}</li>' +
	      '</ul>' +
	      '</div>');
	      var input = tplEl.find('input');
	      input.attr('type', tAttrs.type);
	      input.attr('ng-model', tAttrs.ngModel);
	      input.attr('timezone', tAttrs.timezone);
	      tEle.replaceWith(tplEl);


	      return function(scope, ele, attrs, ctrl) {
	        var minKeyCount = attrs.minKeyCount || 3,
	            timer,
	            input = ele.find('input');

	        input.bind('keyup', function(e) {
	          val = ele.val();
	          if (val.length < minKeyCount) {
	            if (timer) $timeout.cancel(timer);
	            scope.reslist = null;
	            return;
	          } else {
	            if (timer) $timeout.cancel(timer);
	            timer = $timeout(function() {
	              scope.autoFill()(val)
	              .then(function(data) {
	                if (data && data.length > 0) {
	                  scope.reslist = data;
	                  scope.ngModel = data[0].name;
	                  scope.timezone = data[0].tz;
	                  // scope.ngModel = "zmw:" + data[0].zmw;
	                }
	              });
	            }, 3000);
	          }
	        });
	        // Hide the reslist on blur
	        input.bind('blur', function(e) {
	          scope.reslist = null;
	          scope.$digest();
	        });
	      }
	    }
	  }
	})
	.controller('MainController', function($scope, $timeout, Weather, UserService){
		//Build the date object
		$scope.date = {};

	    $scope.weather = {}
	    // Hardcode San_Francisco for now
	    $scope.user = UserService.user;
	    Weather.getWeatherForecast($scope.user.location)
	    .then(function(data) {
	      $scope.weather.forecast = data;
	    });

		//Update function
		var updateTime = function(){
			$scope.date.tz = new Date(new Date().toLocaleString(
	          "en-US", {timeZone: $scope.user.timezone}
	        ));
	      	$timeout(updateTime, 1000);
		}

		//Kick off the update function
		updateTime();
	})
	.controller('SettingsController', function($scope, UserService, Weather){
		$scope.user = UserService.user;
		$scope.fetchCities = Weather.getCityDetails;
		$scope.save = function(){
			UserService.save();
		}
	});
