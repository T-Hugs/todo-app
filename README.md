# todo-app

Compare different methods of state management and state changes...

## Branches
1. `master` - no state management (the app is broken!)
2. `vanilla` - No library imported. Creates a store that emits very crude events, which are subscribed to by components.
3. `mobx` - Same as `vanilla` but uses MobX instead of crude events and their subscriptions.
4. `azdev-observables` - Same as `mobx` but uses Azure DevOps Observable library instead of MobX. There is significant broken functionality, so this is just meant to be a proof-of-concept. Stats is not Observed.
5. `mobx-state-tree` - Rips out the custom `Store` in favor of mobx-state-tree models. Functionaliy is mostly complete, but there are minor differences compared to `vanilla` and `mobx`.

## Comparisons
* `master` <= `vanilla`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..vanilla)
* `master` <= `mobx`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..mobx)
* `master` <= `mobx-state-tree`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..mobx-state-tree)
* `master` <= `azdev-observables`: [Compare](https://github.com/T-Hugs/todo-app/compare/master..azdev-observables)
* `vanilla` <= `mobx`: [Compare](https://github.com/T-Hugs/todo-app/compare/vanilla..mobx)
* `vanilla` <= `mobx-state-tree`: [Compare](https://github.com/T-Hugs/todo-app/compare/vanilla..mobx-state-tree)
* `vanilla` <= `azdev-observables`: [Compare](https://github.com/T-Hugs/todo-app/compare/vanilla..azdev-observables)
* `azdev-observables` <= `mobx`: [Compare](https://github.com/T-Hugs/todo-app/compare/azdev-observables..mobx)
* `mobx` <= `azdev-observables`: [Compare](https://github.com/T-Hugs/todo-app/compare/mobx..azdev-observables)
