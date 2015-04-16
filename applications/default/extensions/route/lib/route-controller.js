/*
 * Route controller.
 */

/*
 * Module dependencies.
 */
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var express = require('express');
var async = require('async');

/**
 * Main route controller class.
 *
 * @param {Application} application Application.
 * @param {Object} settings Application settings object.
 * @class RouteController
 */
var RouteController = module.exports = function(application, settings) {
  this.application = application;
  this.settings = settings;

  // Prepare route register params.
  var params = [this.settings.path];

  // Prepare the middleware, if available.
  if ('middleware' in this.settings) {
    params.push(this.settings.middleware);
  }

  // Prepare the route handler.
  var self = this;
  params.push(function(request, response) {
    self.handle(request, response);
  });

  // Register route on the appropriate router.
  var router = this.application.routers[this.settings.router];
  var method = this.settings.method || 'all';
  router[method].apply(router, params);
};

/**
 * Handle a request.
 *
 * @param {Request} request Request object.
 * @param {Response} response Response object
 */
RouteController.prototype.handle = function(request, response) {
  var self = this;
  var settings = this.settings;

  // Response decorator function, used to allow extensions to alter the response
  // for content responses via response() hook.
  var responseDecorator = function(payload, request, response, callback) {
    // Run response() hook on all extensions.
    self.application.invoke('response', payload, request, response, callback);
  };

  this.access(request, response, function(error, allow) {
    if (error) {
      return RouteController.error(request, response, error);
    }

    if (allow !== true) {
      // Access denied.
      return RouteController.forbidden(request, response);
    }

    if (settings.content) {
      return RouteController.respond(request, response, settings.content, responseDecorator);
    }

    if (settings.callback) {
      return settings.callback(request, response, function(error, content, code) {
        if (error) {
          return RouteController.error(request, response, error);
        }

        RouteController.respond(request, response, content, code, responseDecorator);
      });
    }

    // If there's no content nor a callback, return 404 error.
    RouteController.notFound(request, response);
  });
};

/**
 * Access check.
 *
 * @param {Request} request Request object.
 * @param {Response} response Response object.
 * @param {Function} callaback Function called with the access check results.
 */
RouteController.prototype.access = function(request, response, callback) {
  var settings = this.settings;

  // If this is an object, do access check and other mandatory stuff.
  if (settings.access) {
    if (typeof settings.access === 'boolean') {
      // Access check is a string/permission key.
      return callback(null, settings.access);
    }
    else if (typeof settings.access === 'string') {
      return this.application.access(request, settings.access, callback);
    }
    else if (typeof settings.access === 'function') {
      // Access check is a callback.
      return settings.access(request, response, callback);
    }
  }

  // Default to false. Deny access.
  return callback(null, false);
};

/**
 * Respond to a request.
 *
 * @param {Request} request Request object.
 * @param {Response} response Response object.
 * @param {Object|String} content Content to send.
 * @param {Number} [code] HTTP status code.
 * @param {Function} [decorator] A function to run on the response data before
 * sending it.
 */
RouteController.respond = function(request, response, content, code, decorator) {
  // Default to 200 (success).
  var code = code || 200;

  // Create a payload envelope to pass to the decorator function.
  var payload = {
    status: {
      code: code
    },
    data: null
  };

  if (content) {
    payload.data = content;
  }

  if (decorator) {
    return decorator(payload, request, response, function() {
      response
        .status(payload.status.code)
        .send(payload.data);
    });
  }

  response
    .status(payload.status.code)
    .send(payload.data);
};

/**
 * Respond to a request with a "server error".
 *
 * @param {Request} request Request object.
 * @param {Response} response Response object.
 */
RouteController.error = function(request, response, error) {
  RouteController.respond(request, response, {
    title: 'Server error',
    description: "The server couldn't process the request.",
    error: error.toString()
  }, 500);
};

/**
 * Respond to a request with a "page not found" error.
 *
 * @param {Request} request Request object.
 * @param {Response} response Response object.
 */
RouteController.notFound = function(request, response) {
  RouteController.respond(request, response, {
    title: 'Page not found',
    description: "The page you're looking for wasn't found."
  }, 404);
};

/**
 * Respond to a request with a "forbidden" error.
 *
 * @param {Request} request Request object.
 * @param {Response} response Response object.
 */
RouteController.forbidden = function(request, response) {
  RouteController.respond(request, response, {
    title: 'Forbidden',
    description: "You don't have permission to access this page."
  }, 403);
};
