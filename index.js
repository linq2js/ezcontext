import React, { createElement } from 'react';

let symbolId = new Date().getTime();
const createSymbol = typeof Symbol === 'undefined' ? () => symbolId++ : Symbol;
const isHoc = createSymbol('Hoc');
const isContext = createSymbol('Context');
const isAction = createSymbol('Actiion');
const dataProp = createSymbol['Data'];
const consumerProp = createSymbol('Consumer');
const providerProp = createSymbol('Provider');

// create default method for context
function defaultMethodCreator($) {
  return {
    update: $
  };
}

// improve performance by using PureComponent
class CachableConsumer extends React.PureComponent {
  render() {
    const { __component: Component, ...props } = this.props;
    return createElement(Component, props);
  }
}

function createData(value, methods) {
  return {
    value,
    ...methods
  };
}

// render multiple context consumers
function render(ownedProps, args, index, contextToProps, contexts, component) {
  const context = contexts[index];
  if (!context) {
    const props = contextToProps.apply(null, [ownedProps].concat(args)) || {};
    if (typeof props === 'function') {
      return props(component);
    }
    props.__component = component;
    return createElement(CachableConsumer, props);
  }
  return createElement(context[consumerProp], {}, x =>
    render(
      ownedProps,
      args.concat([x]),
      index + 1,
      contextToProps,
      contexts,
      component
    )
  );
}

function connect(contexts, contextToProps, component) {
  return function(props) {
    const args = [];
    return render(props, args, 0, contextToProps, contexts, component);
  };
}

/**
 * create computed context
 */
function computed(computer, contexts) {
  const recomputeAndNotify = debounce(0, () => {
    computedContext(recompute());
  });
  computer = selector(computer);
  contexts.forEach(context => context(recomputeAndNotify));

  function recompute() {
    const mappedArgs = contexts.map(context => context());
    return computer.apply(null, mappedArgs);
  }

  const computedContext = createContext({ readonly: true }, recompute());

  return computedContext;
}

function createContext(options, data, methodCreator = defaultMethodCreator) {
  const context = React.createContext(data);
  const subscribers = [];
  const methods =
    typeof methodCreator === 'function'
      ? methodCreator(accessor)
      : methodCreator;
  const wiredMethods = Object.entries(methods).reduce(
    (wiredMethods, [name, method]) => {
      wiredMethods[name] = function() {
        const result = method.apply(null, arguments);
        if (typeof result === 'function') {
          accessor(result(data));
          return;
        }

        return result;
      };
      return wiredMethods;
    },
    {}
  );
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
      const subscriber = payload;
      subscribers.push(subscriber);
      return function() {
        const index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      };
    }
    if (payload === data) return;
    data = payload;
    accessor[dataProp] = createData(data, wiredMethods);
    subscribers.forEach(subscriber => subscriber(data));
  }

  /**
   * create simple HOC component and pass context value to specified prop name
   */
  function hoc(propName) {
    return Object.assign(
      Component => props =>
        createElement(context.Consumer, {}, context =>
          createElement(
            Component,
            propName
              ? // passing context value as specified prop
              { [propName]: context.value, ...props }
              : // passing context value as props
              context.value
          )
        ),
      {
        [isHoc]: true
      }
    );
  }

  return Object.assign(accessor, {
    hoc,
    // wire method
    ...wiredMethods,
    [isContext]: true,
    [dataProp]: createData(data, wiredMethods),
    [consumerProp]: context.Consumer,
    [providerProp]: class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { context: accessor[dataProp] };
        this.unsubscribe = accessor(newData => {
          this.setState({ context: accessor[dataProp] });
        });
      }

      componentWillUnmount() {
        this.unsubscribe();
      }

      render() {
        return createElement(
          context.Provider,
          { value: this.state.context },
          this.props.children
        );
      }
    }
  });
}

export function create() {
  if (arguments[0] && arguments[0][isContext]) {
    // create computed context
    const contexts = [].slice.call(arguments);
    return computed(contexts.pop(), contexts);
  }

  return createContext({}, arguments[0], arguments[1]);
}

function invoke(action, contexts, args) {
  return action(...args)(...contexts.map(x => x[dataProp]));
}

function createHocOrAction(hoc, contexts) {
  return Object.assign(
    function() {
      if (typeof arguments[0] !== 'function') {
        // invoke action
        return invoke(hoc, contexts, [].slice.call(arguments));
      }

      const component = arguments[0];
      const args = [].slice.call(arguments, 1);

      return connect(
        contexts,
        function(ownedProps) {
          const contextData = [].slice.call(arguments, 1);
          // render directly
          return () => hoc(...args)(...contextData)(component, ownedProps);
        }
      );
    },
    {
      [isHoc]: true,
      [isAction]: true
    }
  );
}

/**
 * compose all hocs
 */
function compose(hocs) {
  return function(component) {
    return hocs.reduce((component, hoc) => hoc(component), component);
  };
}

/**
 * compose multple contexts for creating Component/HocComponent/Action
 */
export function use(...contexts) {
  if (contexts[0][isHoc]) {
    return compose(contexts);
  }
  const Provider = contexts.reduce(
    (Wrapper, context) => props =>
      createElement(
        Wrapper,
        {},
        createElement(context[providerProp], {}, props.children)
      ),
    props => props.children
  );
  return function() {
    // use(...contexts) => HOC
    if (typeof arguments[0] === 'function') {
      // wrap component
      if (arguments.length > 1) {
        return connect(
          contexts,
          arguments[0],
          arguments[1]
        );
      }

      // wrap hoc
      return createHocOrAction(arguments[0], contexts);
    }
    const props = arguments[0];
    return createElement(Provider, {}, props.children);
  };
}

export function selector(...funcs) {
  const lastFunc = funcs.pop();
  let lastArgs, lastResult;
  const wrapper = function(...args) {
    if (shallowEqual(lastArgs, args)) {
      return lastResult;
    }
    lastArgs = args;
    return (lastResult = lastFunc.apply(null, args));
  };

  if (!funcs.length) {
    return wrapper;
  }

  const argSelectors = funcs.map(x => selector(x));
  return function(...args) {
    const mappedArgs = argSelectors.map(x => x.apply(null, args));
    return wrapper.apply(null, mappedArgs);
  };
}

export function shallowEqual(value1, value2, ignoreFuncs) {
  if (value1 === value2) return true;
  // compare date
  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.getTime() === value2.getTime();
  }
  if (value1 && value2) {
    if (Array.isArray(value1)) {
      const length = value1.length;
      if (length !== value2.length) return false;
      for (let i = 0; i < length; i++) {
        const value1Prop = value1[i];
        const value2Prop = value2[i];
        if (
          ignoreFuncs &&
          typeof value1Prop === 'function' &&
          typeof value2Prop === 'function'
        )
          continue;
        if (value1Prop !== value2Prop) return false;
      }
      return true;
    }
    const value1Keys = Object.keys(value1);
    if (value1Keys.length !== Object.keys(value2).length) return false;
    for (let key of value1Keys) {
      const value1Prop = value1[key];
      const value2Prop = value2[key];
      if (
        ignoreFuncs &&
        typeof value1Prop === 'function' &&
        typeof value2Prop === 'function'
      )
        continue;
      if (value1Prop !== value2Prop) return false;
    }
    return true;
  }
  return false;
}

export function debounce(interval, callback) {
  let timer;

  return function() {
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => callback.apply(null, args), interval);
  };
}
