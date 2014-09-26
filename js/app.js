/**
* myApp Module
*
* Simple Chrome Weather App
*/
angular.module('myApp', [])
	.controller('MainController', function($scope, $timeout){
		//Build the date object
		$scope.date = {};

		//Update function
		var updateTime = function(){
			$scope.date.raw = new Date();
			$timeout(updateTime, 1000);
		}

		//Kick off the update function
		updateTime();
	})
	.provider('Weather', function(){
		var apiKey = "edce8d7f316b6fe4";

		this.setApiKey = function(key){
			if(key) this.apiKey = key;
		};

		this.$get = function($http){
			return{
				// Service object
			}
		}
	})