# ezcontext

A implementation of ACV (Action → Context → View) for React

## Features

1.  Lightweight
1.  Based on new React context API
1.  Support using multiple contexts at once
1.  Support computed contexts
1.  Support High Order Component creator

## ezcontext in actions

1.  Basic Functions https://codesandbox.io/s/m14qn9kyy
1.  Todo App https://codesandbox.io/s/y3qlo47vxz

## Samples

### create(value:any, methods):Context

Create a new Context with specified value and method list. If no methods specified, ezcontext creates default wired method which named update(newState)

```js
import { create } from "ezcontext";

const UserContext = create("guest", {
  loginAsAdmin: () => "admin",
  logout: () => "guest"
});

console.log(UserContext()); // => "guest"
UserContext.loginAsAdmin();
console.log(UserContext()); // => "admin"
UserContext.logout();
console.log(UserContext()); // => "guest"
```

### create(value:any, methodCreator:(contextAccessor)=>Object):Context

Create a new Context with specified value and methodCreator. methodCreator retrieves contextAccessor and must return method list

```js
import { create } from "ezcontext";

const Todos = create([], context => ({
  // load todos from server
  load() {
    // perform lazy update todos once data is loaded
    return fetch(`http://tempuri.org/todos`)
      .then(res => res.json())
      .then(todos => context(todos));
  }
}));
```

### create(...contexts:Context[]):ComputedContext

Create a new ComputedContext which has one or many dependency Context. Once dependency contexts updated, ComputedContext will be recomputed

```js
import { create } from "ezcontext";

const ContextA = create(1);
const ContextB = create(2);
const ContextAB = create(
  ContextA,
  ContextB,
  (aValue, bVlaue) => aValue + bValue
);

console.log(ContextAB()); // => 3
```

### Create wired component

```jsx harmony
import { create, use } from "ezcontext";
const IdsContext = create([1, 2]);
const TodosContext = create({
  1: { text: "item 1" },
  2: { text: "item 2" }
});

const TodoList = use(
  IdsContext,
  TodosContext,
  ($ids, $todos) => ({ ids: $ids.value, todos: $todos.value }),
  props => {
    /* render todo list */
  }
);
```

### Create an action connected with multiple contexts

```jsx harmony
import { create, use } from "ezcontext";
const IdsContext = create([1, 2]);
const TodosContext = create({});

const AddTodo = use(IdsContext, TodosContext)(text => ($ids, $todos) => {
  const id = new Date().getTime();
  $ids.add(id);
  $todos.add(id, { text });
});

AddTodo("New Todo");
```

### Create High Order Component

```jsx harmony
import React from "react";
import { create, use } from "ezcontext";

const UserContext = create("guest");
const Authenticate = use(UserContext)(
  allowUser => $user => (Component, props) =>
    allowUser === $user.value ? (
      <Component {...props} />
    ) : (
      <div>Access denied</div>
    )
);
const AdminScreen = Authenticate("admin")(props => {
  /* render admin screen here */
});
```

### Create HOC from context

```jsx harmony
import React from "react";
import { create, use } from "ezcontext";

const UserContext = create("guest");
const UserHoc = UserContext.hoc("username");
const UserProfile = UserHoc(props => <div>{props.username}</div>);
```

### Create HOC from multiple contexts

```jsx harmony
import React from "react";
import { create, use } from "ezcontext";

const UserContext = create("guest");
const ThemeContext = create("default");
const DataContext = create("data");
const Hoc = use(
  UserContext.hoc("user"),
  ThemeContext.hoc("theme"),
  DataContext.hoc("data")
);
const Dashboard = Hoc(props => {
  /* render dashboard */
});
```
