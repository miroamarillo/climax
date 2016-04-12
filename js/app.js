/**
* myApp Module
*
* Simple Chrome Weather App
*/
angular.module('myApp', ['ngRoute'])
	.config(function(WeatherProvider) {
		WeatherProvider.setApiKey('edce8d7f316b6fe4');
	})
	.provider('Weather', function(){
		var apiKey = "";

		this.setApiKey = function(key){
			if(key) this.apiKey = key;
		};
		// type can be an array for multiple calls or a string for one call
		this.getUrl = function(type, ext) {
			//Check if type is an array
			if (Array.isArray(type)){
				type = type.join("/");
			}
			return "http://api.wunderground.com/api/" +
			this.apiKey + "/" + type + "/q/" +
			ext + '.json';
		};

		this.$get = function($q, $http){
			var self = this;
			return{

				getMultipleFeatures: function(city){
					var d = $q.defer();
					$http({
						method: 'GET',
						url: self.getUrl(["forecast", "conditions", "astronomy"], city),
						cache: true
					}).success(function(data){
						var iconData = data.forecast.simpleforecast.forecastday;
						for (var i = 0; i < iconData.length; i++) {
							console.log(iconData[i].icon);
						}
						d.resolve(data);
					}).error(function(err){
						d.reject(err);
					});
					return d.promise;
				},
				getCityDetails: function(query) {
					var d = $q.defer();
					$http({
						method: 'GET',
						url: "http://autocomplete.wunderground.com/aq?query=" +	query
					}).success(function(data) {
						console.log(data.RESULTS);
						d.resolve(data.RESULTS);
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
		// var defaults = {
		// 	location: 'autoip'
		// };
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
				var tplEl = angular.element(
					'<div class="typeahead">' +
						'<input type="text" autocomplete="off" />' +
						'<ul id="autolist" ng-show="reslist">' +
							'<li ng-repeat="res in reslist">{{ res.name }}</li>' +
						'</ul>' +
					'</div>'
				);
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
						}
						else {
							if (timer) $timeout.cancel(timer);
							timer = $timeout(function() {
								scope.autoFill()(val)
									.then(function(data) {
										if (data && data.length > 0) {
											scope.reslist = data;
											console.log(scope.reslist.length);
											console.log(scope);
											scope.ngModel = data[0].name;
											console.log(scope.reslist[0].name);
											// scope.ngModel = data[0].name;
											// scope.timezone = data[0].tz;
											// scope.ngModel = "zmw:" + data[0].zmw;
										}
									});
							}, 1000);
						}
					});
					// Hide the reslist on blur
					// input.bind('blur', function(e) {
					// 	scope.reslist = null;
					// 	scope.$digest();
					// });
				}
			}
		}
	})
	.controller('MainController', function($scope, $timeout, Weather, UserService){

		$scope.weather = {};

		$scope.user = UserService.user;

		Weather.getMultipleFeatures($scope.user.location)
			.then(function(data){
				$scope.weather.forecast = data.forecast.simpleforecast.forecastday;
				$scope.weather.conditions = data.current_observation;
				$scope.weather.moonStatus = data.moon_phase;
				$scope.weather.sunTiming = {
					"sunrise": data.moon_phase.sunrise.hour + ":" + data.moon_phase.sunrise.minute,
					"sunset": data.moon_phase.sunset.hour + ":" + data.moon_phase.sunset.minute,
					"currentTime": data.moon_phase.current_time.hour + ":" + data.moon_phase.current_time.minute
				}
				if($scope.weather.sunTiming.current_time >= $scope.weather.sunTiming.sunset){
					$scope.weather.iconFlag = 'night';
				}
				else {
					$scope.weather.iconFlag = 'day';
				}
			});

		//Update function
		//Build the date object
		$scope.date = {};
		var updateTime = function(){
			$scope.date.tz = new Date(new Date().toLocaleString(
				"en-US", {timeZone: $scope.user.timezone}
			));
			$timeout(updateTime, 1000);
		}

		//Kick off the update function
		console.log($scope);
		updateTime();
	})
	.controller('SettingsController', function($scope, $location, UserService, Weather){
		$scope.user = UserService.user;

		$scope.save = function(){
			UserService.save();
			$location.path('/');
		}

		$scope.fetchCities = Weather.getCityDetails;
		console.log($scope);
	});
