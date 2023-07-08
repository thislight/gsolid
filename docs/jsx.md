# JSX

JSX is the core of GSolid.

## The burned line of two worlds

In GSolid, you create "components". They are JavaScript functions, must be run under reactive context, returns widgets. By saying "widget", we say the GTK widgets.

You can instantly use widgets as components by function `useWidget` or component `Widget` from `gsolid/widget`. You can also wrap any component into a widget by creating a new GTK `Widget` class (with reactive context).

GSolid operates on native JavaScript functions and GTK widgets. That's why GSolid so performant and familiar: It adds little middleware.

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