# JSX

JSX is the core of GSolid.

## The burned line of two worlds

GSolid operates on JavaScript functions and GTK widgets.

In GSolid, you create "components". They are JavaScript functions, must be run under reactive context, returns widgets. By saying "widget", we say the GTK widgets.

You can instantly use widgets as components by function `useWidget` or component `Widget` from `gsolid/widget`. You can also wrap any component into a widget by creating a new GTK `Widget` class (with reactive context).

An important note is that you can use the JSX syntax anywhere and the result is a widget. For example:

```jsx
import {Window, Label} from "gsolid/gtk4"

const showHelloWorld = () => {
    const window = <Window />
    window.set_child(<Label label="Hello World">)
    window.present()
}
```

## Properties

By default, GSolid will convert big camel names into kabel names for properties.

For example, "items" will set "items" and "itemFactory" will set "item-factory".

### `onXxxXxx`

Connect the function to the signal "xxx-xxx", the big camel name will be converted into a kabel name. For example, "onClick" will connect to "click", "onPropertyChanged" will connect to "property-changed".

````jsx
<Button onClick={() => console.log("click")} />
````

### `on:xxx-xxx`

Connect the function to the signal "xxx-xxx", without any transform on the name. For example, "on:Click" will connect to "Click", "on:property-changed" will connect to "property-changed".

````jsx
<Component on:property-changed={() => console.log("property changed")}>
````

### `prop:xxx`

Set the property "xxx", without any transform on the name. 

````jsx
// We can bypass on___ conversion by `prop:`.
// Following will set "onSomeProperty" property, not connect the signal.
<Component prop:onSomeProperty={value}>
````

### `children`
```jsx
<Component1>
    <Component2 />
</Component1>
```

Above code is same as

```jsx
<Component1 children={<Component2 />}>
```

Like other properties, `children` is lazy in both gsolid and solid js. 

It does not matter if you just passing the property to another component, but matter when consuming the children. You must evaluate the children at the render phase and only evaluate once. `createRenderEffect` plus `untrack` can do the trick, but the `children` helper is recommended.

