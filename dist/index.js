'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.create = create;
exports.use = use;
exports.selector = selector;
exports.shallowEqual = shallowEqual;
exports.debounce = debounce;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var symbolId = new Date().getTime();
var createSymbol = typeof Symbol === 'undefined' ? function () {
  return symbolId++;
} : Symbol;
var isHoc = createSymbol('Hoc');
var isContext = createSymbol('Context');
var isAction = createSymbol('Actiion');
var dataProp = createSymbol['Data'];
var consumerProp = createSymbol('Consumer');
var providerProp = createSymbol('Provider');

// create default method for context
function defaultMethodCreator($) {
  return {
    update: $
  };
}

// improve performance by using PureComponent

var CachableConsumer = function (_React$PureComponent) {
  _inherits(CachableConsumer, _React$PureComponent);

  function CachableConsumer() {
    _classCallCheck(this, CachableConsumer);

    return _possibleConstructorReturn(this, (CachableConsumer.__proto__ || Object.getPrototypeOf(CachableConsumer)).apply(this, arguments));
  }

  _createClass(CachableConsumer, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          Component = _props.__component,
          props = _objectWithoutProperties(_props, ['__component']);

      return (0, _react.createElement)(Component, props);
    }
  }]);

  return CachableConsumer;
}(_react2.default.PureComponent);

function createData(value, methods) {
  return _extends({
    value: value
  }, methods);
}

// render multiple context consumers
function render(ownedProps, args, index, contextToProps, contexts, component) {
  var context = contexts[index];
  if (!context) {
    var props = contextToProps.apply(null, [ownedProps].concat(args)) || {};
    if (typeof props === 'function') {
      return props(component);
    }
    props.__component = component;
    return (0, _react.createElement)(CachableConsumer, props);
  }
  return (0, _react.createElement)(context[consumerProp], {}, function (x) {
    return render(ownedProps, args.concat([x]), index + 1, contextToProps, contexts, component);
  });
}

function connect(contexts, contextToProps, component) {
  return function (props) {
    var args = [];
    return render(props, args, 0, contextToProps, contexts, component);
  };
}

/**
 * create computed context
 */
function computed(computer, contexts) {
  var recomputeAndNotify = debounce(0, function () {
    computedContext(recompute());
  });
  computer = selector(computer);
  contexts.forEach(function (context) {
    return context(recomputeAndNotify);
  });

  function recompute() {
    var mappedArgs = contexts.map(function (context) {
      return context();
    });
    return computer.apply(null, mappedArgs);
  }

  var computedContext = createContext({ readonly: true }, recompute());

  return computedContext;
}

function createContext(options, data) {
  var _extends3;

  var methodCreator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultMethodCreator;

  var context = _react2.default.createContext(data);
  var subscribers = [];
  var methods = typeof methodCreator === 'function' ? methodCreator(accessor) : methodCreator;
  var wiredMethods = Object.entries(methods).reduce(function (wiredMethods, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        name = _ref2[0],
        method = _ref2[1];

    wiredMethods[name] = function () {
      var result = method.apply(null, arguments);
      if (typeof result === 'function') {
        accessor(result(data));
        return;
      }

      return result;
    };
    return wiredMethods;
  }, {});
  /**
   * define accessor for context
   * accessor() => get ccurrent context value
   * accessor(newValue) => set new value for current context
   * accessor(subscriber) => register new subscription and return a func, call that func to unsubscribe subscription
   */
  function accessor(payload) {
    if (!arguments.length) return data;
    // subscribe
    if (typeof payload === 'function') {
      var subscriber = payload;
      subscribers.push(subscriber);
      return function () {
        var index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      };
    }
    if (payload === data) return;
    data = payload;
    accessor[dataProp] = createData(data, wiredMethods);
    subscribers.forEach(function (subscriber) {
      return subscriber(data);
    });
  }

  /**
   * create simple HOC component and pass context value to specified prop name
   */
  function hoc(propName) {
    return Object.assign(function (Component) {
      return function (props) {
        return (0, _react.createElement)(context.Consumer, {}, function (context) {
          return (0, _react.createElement)(Component, propName ? // passing context value as specified prop
          _extends(_defineProperty({}, propName, context.value), props) : // passing context value as props
          context.value);
        });
      };
    }, _defineProperty({}, isHoc, true));
  }

  return Object.assign(accessor, _extends({
    hoc: hoc
  }, wiredMethods, (_extends3 = {}, _defineProperty(_extends3, isContext, true), _defineProperty(_extends3, dataProp, createData(data, wiredMethods)), _defineProperty(_extends3, consumerProp, context.Consumer), _defineProperty(_extends3, providerProp, function (_React$Component) {
    _inherits(_class, _React$Component);

    function _class(props) {
      _classCallCheck(this, _class);

      var _this2 = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, props));

      _this2.state = { context: accessor[dataProp] };
      _this2.unsubscribe = accessor(function (newData) {
        _this2.setState({ context: accessor[dataProp] });
      });
      return _this2;
    }

    _createClass(_class, [{
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this.unsubscribe();
      }
    }, {
      key: 'render',
      value: function render() {
        return (0, _react.createElement)(context.Provider, { value: this.state.context }, this.props.children);
      }
    }]);

    return _class;
  }(_react2.default.Component)), _extends3)));
}

function create() {
  if (arguments[0] && arguments[0][isContext]) {
    // create computed context
    var contexts = [].slice.call(arguments);
    return computed(contexts.pop(), contexts);
  }

  return createContext({}, arguments[0], arguments[1]);
}

function invoke(action, contexts, args) {
  return action.apply(undefined, _toConsumableArray(args)).apply(undefined, _toConsumableArray(contexts.map(function (x) {
    return x[dataProp];
  })));
}

function createHocOrAction(hoc, contexts) {
  var _Object$assign2;

  return Object.assign(function () {
    if (typeof arguments[0] !== 'function') {
      // invoke action
      return invoke(hoc, contexts, [].slice.call(arguments));
    }

    var component = arguments[0];
    var args = [].slice.call(arguments, 1);

    return connect(contexts, function (ownedProps) {
      var contextData = [].slice.call(arguments, 1);
      // render directly
      return function () {
        return hoc.apply(undefined, _toConsumableArray(args)).apply(undefined, _toConsumableArray(contextData))(component, ownedProps);
      };
    });
  }, (_Object$assign2 = {}, _defineProperty(_Object$assign2, isHoc, true), _defineProperty(_Object$assign2, isAction, true), _Object$assign2));
}

/**
 * compose all hocs
 */
function compose(hocs) {
  return function (component) {
    return hocs.reduce(function (component, hoc) {
      return hoc(component);
    }, component);
  };
}

/**
 * compose multple contexts for creating Component/HocComponent/Action
 */
function use() {
  for (var _len = arguments.length, contexts = Array(_len), _key = 0; _key < _len; _key++) {
    contexts[_key] = arguments[_key];
  }

  if (contexts[0][isHoc]) {
    return compose(contexts);
  }
  var Provider = contexts.reduce(function (Wrapper, context) {
    return function (props) {
      return (0, _react.createElement)(Wrapper, {}, (0, _react.createElement)(context[providerProp], {}, props.children));
    };
  }, function (props) {
    return props.children;
  });
  return function () {
    // use(...contexts) => HOC
    if (typeof arguments[0] === 'function') {
      // wrap component
      if (arguments.length > 1) {
        return connect(contexts, arguments[0], arguments[1]);
      }

      // wrap hoc
      return createHocOrAction(arguments[0], contexts);
    }
    var props = arguments[0];
    return (0, _react.createElement)(Provider, {}, props.children);
  };
}

function selector() {
  for (var _len2 = arguments.length, funcs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    funcs[_key2] = arguments[_key2];
  }

  var lastFunc = funcs.pop();
  var lastArgs = void 0,
      lastResult = void 0;
  var wrapper = function wrapper() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    if (shallowEqual(lastArgs, args)) {
      return lastResult;
    }
    lastArgs = args;
    return lastResult = lastFunc.apply(null, args);
  };

  if (!funcs.length) {
    return wrapper;
  }

  var argSelectors = funcs.map(function (x) {
    return selector(x);
  });
  return function () {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    var mappedArgs = argSelectors.map(function (x) {
      return x.apply(null, args);
    });
    return wrapper.apply(null, mappedArgs);
  };
}

function shallowEqual(value1, value2, ignoreFuncs) {
  if (value1 === value2) return true;
  // compare date
  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.getTime() === value2.getTime();
  }
  if (value1 && value2) {
    if (Array.isArray(value1)) {
      var length = value1.length;
      if (length !== value2.length) return false;
      for (var i = 0; i < length; i++) {
        var value1Prop = value1[i];
        var value2Prop = value2[i];
        if (ignoreFuncs && typeof value1Prop === 'function' && typeof value2Prop === 'function') continue;
        if (value1Prop !== value2Prop) return false;
      }
      return true;
    }
    var value1Keys = Object.keys(value1);
    if (value1Keys.length !== Object.keys(value2).length) return false;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = value1Keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        var _value1Prop = value1[key];
        var _value2Prop = value2[key];
        if (ignoreFuncs && typeof _value1Prop === 'function' && typeof _value2Prop === 'function') continue;
        if (_value1Prop !== _value2Prop) return false;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return true;
  }
  return false;
}

function debounce(interval, callback) {
  var timer = void 0;

  return function () {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      return callback.apply(null, args);
    }, interval);
  };
}
//# sourceMappingURL=index.js.map