# React-VScroller

> This library is an experiment (and a work in progress). The intent is to prove out the use of IntersectionObserver as a primary mechanism for enabling virtualized rendering of long lists or tables.

## Primary Goals

- Avoid scroll event listeners, instead relying on IntersectionObservers to detect relevant scroll changes
- Support variable sized items
- Must work well in both a full window and a scrollable container
- Avoid assumptions about the type of components being rendered - for example, the same components should work with tables, unordered lists, or a collection of divs.

## Components

### VScroller

`VScroller` is the primary component, which wraps other sub-components and your content. The only required prop is `count`, which tells the component how many items are available to render. Other props include:

| Prop           | Type            | Default | Description                                                                                                                                                                                                                                                                                                       |
| -------------- | --------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| count          | Integer         |         | Tells the component how many items are available to render                                                                                                                                                                                                                                                        |
| updateSignal   | any             |         | Prop which will force a rerender. Only the change of the `count` or `updateSignal` will cause a rerender. Example use cases would be passing in an array if you are binding to a fixed dataset or perhaps a timestamp if you want to force a rerender.                                                            |
| pageSize       | Integer         | 100     | The minimum number of items to render at once. If the provided size does not fill the screen, it will be increased until it does.                                                                                                                                                                                 |
| threshold      | Integer         | 200     | The buffer in pixels before rendering the next range of records.                                                                                                                                                                                                                                                  |
| onRangeChanged | (range) => void |         | Callback which is executed when a new range of items is rendered, which will receive the `Range` object as a parameter.                                                                                                                                                                                           |
| fillerStyle    | CSSProperties   |         | A style object which will be used to style the filler elements above and below the rendered portion. The height of these elements maintains the height of the scrollbar. These elements can become visible briefly during fast scroll transitions, so providing some styling can be useful to give user feedback. |

### VScroller.Head

`VScroller.Head` component can be used to render header content, for example a table header.

| Prop   | Type    | Default | Description                                                                                                                                                                                               |
| ------ | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sticky | Boolean |         | Tells the component that the header is always in the viewport. This doesn't actually change how the content is positioned, but instead tells us when it should be rendered and impacts some calculations. |
| height | Number  |         | Can be used to set a fixed size to the header.                                                                                                                                                            |

### VScroller.Foot

`VScroller.Foot` component can be used to render a footer component. This component will render when the bottom of the collection is near visibility.

### VScroller.Body

`VScroller.Body` component contains the actual content being rendered. This has a render-prop child which is called as items are rendered. The render function takes a single parameter, which is the index of the component to render. The function should return a component that accepts a `ref` which resolves to the underlying DOM element.

Alternately, for more control the Body component accepts a node and will pass a `range` prop which contains the _inclusive_ `start` index and _exclusive_ `end` index, as well as a `done` value which tells whether the collection has more items to render. If you use this approach, you should wrap each item in the Item component.

### VScroller.Item

`VScroller.Item` component wraps an individual item to be rendered. This expects a `ref` from the child component, which is used to determine the height of the rendered item. (This component is only necessary if you are not using the render prop for the Body component.)

_Examples can be found in the Storybook stories included within this repository._

## Caveats

- This library depends on modern browser features like [IntersectionObserver](https://caniuse.com/#feat=intersectionobserver) and [ResizeObserver](https://caniuse.com/#feat=resizeobserver). This functionality is supported in all major browsers. Polyfills do exist which may enable this library to work in legacy browsers (i.e. I.E.), however this is untested.
- IntersectionObservers emits notifications asyncronously. This is nice in that it doesn't block the UI thread, but means that there may be a delay between the event occuring and the callback. Because of this, the filler elements may become visible briefly during scrolling - especially when dragging the scrollbar. This can be optimized by experimenting with the `pageSize` and `threshold` properties. It's recommended to use the `fillerStyle` property to give the filler elements a style that will give the user some indication that an update is pending. For example, a checkboard pattern can be seen in the Storybook examples.
- Only supports vertical scrolling, though the concepts could support vertical scrolling as well.

## TODO

- Some real-world usage, testing, and validation (vet defaults, etc)
- Build more examples, including lists.
- Optimize support for fixed height items. (This works fine already, but opimizations can be made for this scenario.)
