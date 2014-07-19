'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'ngCookies',
  'ngResource',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/products', {templateUrl: 'partials/products.html', controller: 'ProductController'});
  $routeProvider.when('/products/:id', {templateUrl: 'partials/product-details.html', controller: 'ProductDetailsController'});
  $routeProvider.when('/product/add', {templateUrl: 'partials/add-product.html', controller: 'ProductControllerAdd'});
  $routeProvider.otherwise({redirectTo: '/products'});
}]).

// Here we define the authentication system
// This is the source for the integration code:
// http://richardtier.com/2014/03/15/authenticate-using-django-rest-framework-endpoint-and-angularjs/
 
// [1] https://tools.ietf.org/html/rfc2617
// [2] https://developer.mozilla.org/en-US/docs/Web/API/Window.btoa
// [3] https://docs.djangoproject.com/en/dev/ref/settings/#append-slash
// [4] https://github.com/tbosch/autofill-event
// [5] http://remysharp.com/2010/10/08/what-is-a-polyfill/

config(['$httpProvider', function($httpProvider){
  // django and angular both support csrf tokens. This tells
  // angular which cookie to add to what header.
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]).
factory('api', function($resource){
  function add_auth_header(data, headersGetter){
    // as per HTTP authentication spec [1], credentials must be
    // encoded in base64. Lets use window.btoa [2]
    var headers = headersGetter();
    headers['Authorization'] = ('Basic ' + btoa(data.username +
                                        ':' + data.password));
  }
  // defining the endpoints. Note we escape url trailing dashes: Angular
  // strips unescaped trailing slashes. Problem as Django redirects urls
  // not ending in slashes to url that ends in slash for SEO reasons, unless
  // we tell Django not to [3]. This is a problem as the POST data cannot
  // be sent with the redirect. So we want Angular to not strip the slashes!
  return {
    auth: $resource('/django/accounts/auth\\/', {}, {
      login: {method: 'POST', transformRequest: add_auth_header},
      logout: {method: 'DELETE'}
    }),
    users: $resource('/django/accounts/users\\/', {}, {
      create: {method: 'POST'}
    })
  };
}).
controller('authController', function($scope, $http, api) {
  // Angular does not detect auto-fill or auto-complete. If the browser
  // autofills "username", Angular will be unaware of this and think
  // the $scope.username is blank. To workaround this we use the 
  // autofill-event polyfill [4][5]
  $('#id_auth_form input').checkAndTriggerAutoFillEvent();

  $http.get('/django/accounts/checklogin/').success(function(data) {
    $scope.user = data.username;
  });
 
  $scope.getCredentials = function(){
    return {username: $scope.username, password: $scope.password};
  };

  $scope.login = function(){
    api.auth.login($scope.getCredentials()).
      $promise.
         then(function(data){
           // on good username and password
           $scope.user = data.username;
         }).
         catch(function(data){
           // on incorrect username and password
           alert(data.data.detail);
         });
      };
 
      $scope.logout = function(){
        api.auth.logout(function(){
          $scope.user = undefined;
        });
      };
     
      $scope.register = function($event){
        // prevent login form from firing
        $event.preventDefault();
        // create user and immediatly login on success
        api.users.create($scope.getCredentials()).
        $promise.
          then($scope.login).
            catch(function(data){
              alert(data.data.username);
            });
      };
});