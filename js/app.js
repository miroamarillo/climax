/**
* myApp Module
*
* Simple Chrome Weather App
*/
angular.module('myApp', ['ng-route'])
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
			        d.resolve(data.forecast.simpleforecast);
			      }).error(function(err) {
			        d.reject(err);
			      });
			      return d.promise;
			    }
			}
		}
	})
	.config(function(WeatherProvider) {
		WeatherProvider.setApiKey('edce8d7f316b6fe4');
	})
	.controller('MainController', function($scope, $timeout, Weather){
		//Build the date object
		$scope.date = {};

	    $scope.weather = {}
	    // Hardcode San_Francisco for now
	    Weather.getWeatherForecast("CA/San_Francisco")
	    .then(function(data) {
	      $scope.weather.forecast = data;
	    });

		//Update function
		var updateTime = function(){
			$scope.date.raw = new Date();
			$timeout(updateTime, 1000);
		}

		//Kick off the update function
		updateTime();
	})
	.config(function($routeProvider){
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
	})