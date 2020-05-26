# todo-app

This is an example app that compares various methods of state management.

The `master` branch contains no state management (and therefore a broken app - it renders only once because all data is kept in a store which cannot signal to re-render components).

Each branch is a way to "fix" master using a different state management pattern. See below for the branch descriptions.

Also, you will see in the footer area a list of render counts for various components used in the app. This is a good way to compare approaches and see if components are getting rendered unnecessarily.

## Branches
1. `master` ([demo](https://codesandbox.io/s/todo-no-state-watching-8iwk6)) - no state management (the app is broken!)
2. `vanilla` ([demo](https://codesandbox.io/s/todo-vanilla-ofvkz)) - No library imported. Creates a store that emits very crude events, which are subscribed to by components.
3. `mobx` ([demo](https://codesandbox.io/s/todo-mobx-qbzsf)) - Same as `vanilla` but uses MobX instead of crude events and their subscriptions.
4. `azdev-observables` ([demo](https://codesandbox.io/s/todo-azdev-observables-dyx8b)) - Same as `mobx` but uses Azure DevOps Observable library instead of MobX. There is significant broken functionality, so this is just meant to be a proof-of-concept. Stats is not Observed.
5. `mobx-state-tree` ([demo](https://codesandbox.io/s/todo-mobx-state-tree-wi705)) - Rips out the custom `Store` in favor of mobx-state-tree models. Functionaliy is mostly complete, but there are minor differences compared to `vanilla` and `mobx`.

Note: facebookexperimental/recoil was also investigated, but deemed too immature at this point to use in production. But it's definitely something to keep an eye on.

## Comparisons
Use the `Compare` links below to compare between various approaches

* `master` <= `vanilla`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..vanilla)
* `master` <= `mobx`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..mobx)
* `master` <= `mobx-state-tree`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..mobx-state-tree)
* `master` <= `azdev-observables`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..azdev-observables)
* `vanilla` <= `mobx`: [Compare](https://github.com/T-Hugs/todo-app/compare/vanilla..mobx)
* `vanilla` <= `mobx-state-tree`: [Compare](https://github.com/T-Hugs/todo-app/compare/vanilla..mobx-state-tree)
* `vanilla` <= `azdev-observables`: [Compare](https://github.com/T-Hugs/todo-app/compare/vanilla..azdev-observables)
* `azdev-observables` <= `mobx`: [Compare](https://github.com/T-Hugs/todo-app/compare/azdev-observables..mobx)
* `mobx` <= `azdev-observables`: [Compare](https://github.com/T-Hugs/todo-app/compare/mobx..azdev-observables)

## Findings/Thoughts
After building the initial application with vanilla state management, by far the easiest branch to create was the `mobx` branch. Ripping out the crude subscription model was very easy, and when replaced with MobX's observables, things just worked. It was really nice that the MobX observable library had fully wrapped built-in collections, like Array and Map. I didn't have to change any API's so that they would be compatible with MobX.

Building the `azdev-observables` branch was not quite so easy. In fact, I didn't finish it, in that the application has some outstanding bugs. The biggest issue I ran into was the library not supporting the full API for built-in collections (Array and Map). I ended up adding on some new features, like `ObservableArray.map`, `.filter`, and `.slice`. Another issue, which may be unique to the task of adding this library to existing code, was referencing an observable when I needed to reference the underlying value. In most cases TypeScript would catch these problems, but there were a few that went unnoticed, such as when checking `if (toDoItem.completed)` - that will always be true (and valid code) since `completed` is actually an object. It needed to be `if (toDoItem.completed.value)`. MobX doesn't have this issue because dereferencing an observable automatically gives you its value. The downside to this is that passing around references to observables is difficult.

Implementing mobx-state-tree was more difficult than I anticipated. Although some frustration was from me being a first-time user of the library, there were definitely some things that were not so intuitive. Because `mobx-state-tree` provides runtime type safety (as well as build-time type safety), it's a new type system to learn, and it will not be as powerful as TypeScript's.

I like `mobx-state-tree`'s balance between immutability and mutability, and I like the concept of keeping state in a tree. It was particularly helpful in two cases: `toDoItem.move` and `toDoItem.delete`. In both of these, logically the action is happening on the item itself, but the state for these things was maintained on the parent (the ToDoStore). So using `mobx-state-tree`'s `getRoot` function lets us call the relevant function on the containing store (whereas, to the user, the action is being executed on the item). N.b. I ran into a TypeScript issue with `getRoot` - you will notice a type assertion that I was not able to figure out how to remove.

Once the models were created for `mobx-state-tree` it was trivially easy to start using them throughot the app.
