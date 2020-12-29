# React-VScroller

> This library is an experiment (and a work in progress). The intent is to prove out the use of [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) as a primary mechanism for enabling virtualized rendering of long lists or tables.

## Primary Goals

- Avoid scroll event listeners, instead relying on IntersectionObservers to detect relevant viewport changes
- Support variable sized items
- Must work well in both a full window and a scrollable container
- Avoid assumptions about the type of components being rendered - for example, the same components should work with tables, unordered lists, or a collection of elements.
- Must work well with sticky headers
- Should make minimum assumptions about consumers component structure
- Should make minimum UI adjustments

## How it works

Filler elements are injected above and below the elements that are actually rendered. These filler elements are used to stretch the scrollbar to the approximated height of the component with all items rendered. This approximation is based on the items rendered; as items are rendered they are measured. As more items are rendered the accuracy of the filler items will improve. An `IntersectionObserver` is used to trigger when the filler items are nearing the viewport, in either direction. When a filler item is about to be visible a new batch is rendered and the fillers adjusted accordingly. (How close the filler item is to the viewport can be adjusted using the `threshold` prop.)

Ideally these filler items would never be visible, however since `IntersectionObserver` events are asyncronous they can be briefly visible. This is especially apparent when dragging the scrollbar. You can add UI to the filler item via the `fillerStyle` prop, to give a "loading" hint. (For example, a checkerboard pattern.)

An `IntersectionObserver` is also used on the rendered portion, to validate when the rendered portion leaves the viewport that there are no items which should be rendered.

## Components

### VScroller

`VScroller` is the primary component, which wraps other sub-components and your content.

| Prop           | Type            | Default | Required | Description                                                                                                                                                                                                                                                                                                                                               |
| -------------- | --------------- | :-----: | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| count          | Integer         |         |    ✔     | Tells the component how many items are available to render                                                                                                                                                                                                                                                                                                |
| updateSignal   | any             |         |          | This prop will force a rerender when changed. Only the change of the `count` or `updateSignal` will cause a rerender. Example use cases would be passing in an array if you are binding to a fixed dataset or perhaps a timestamp if you want to force a rerender. (This prop is necessary since a new dataset could be added with the exact same count.) |
| pageSize       | Integer         |   100   |          | The minimum number of items to render at once. If the provided size does not fill the screen, it will be increased until it does, though this will cause rerenders.                                                                                                                                                                                       |
| threshold      | Integer         |   300   |          | The buffer (in pixels) before rendering the next or previous range of items.                                                                                                                                                                                                                                                                              |
| onRangeChanged | (range) => void |         |          | Callback which is executed when a new range of items is rendered, which will receive the [`Range`](#range) object as a parameter.                                                                                                                                                                                                                         |
| fillerStyle    | CSSProperties   |         |          | A style object which will be used to style the filler elements above and below the rendered portion. The height of these elements maintains the height of the scrollbar. These elements can become visible briefly during fast scroll transitions, so providing some styling can be useful to give user feedback.                                         |

### VScroller.Head

`VScroller.Head` component can be used to render header content, for example a table header. This should wrap your own header component.

| Prop   | Type    | Default | Required | Description                                                                                                                                                                                               |
| ------ | ------- | :-----: | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sticky | Boolean |         |          | Tells the component that the header is always in the viewport. This doesn't actually change how the content is positioned, but instead tells us when it should be rendered and impacts some calculations. |
| height | Number  |         |          | Can be used to set a fixed size to the header.                                                                                                                                                            |

### VScroller.Foot

`VScroller.Foot` component can be used to render a footer component. This component will render when the bottom of the collection is near visibility. This should wrap your own footer content.

| Prop   | Type   | Default | Required | Description                                    |
| ------ | ------ | :-----: | :------: | ---------------------------------------------- |
| height | Number |         |          | Can be used to set a fixed size to the footer. |

### VScroller.Body

`VScroller.Body` component contains the actual content being rendered. This has a render-prop child which is called as items are rendered. The render function takes a single parameter, which is the index of the component to render. The function should return a component that accepts a `ref` which resolves to the underlying DOM element. This is necessary to measure the component. The render prop will be called for each item expected to render.

```jsx
<VScroller count={2000}>
  <VScroller.Body>
    {(index) => (
      <tr>
        <td>
          <YourComponent index={index} />
        </td>
      </tr>
    )}
  </VScroller.Body>
</VScroller>
```

Alternately, for more control the Body component accepts a child node and will pass a [`range`](#range) prop. If you use this approach, you should wrap each item in the `VScroller.Item` component.

```jsx
function YourBody({ range }) {
  const { start, end } = range;
  const count = end - start;
  const indices = Array.from(Array(count), (_, i) => i + start);

  return (
    <>
      {indices.map((index) => (
        <VScroller.Item key={index} index={index}>
          <YourComponent index={index} />
        </VScroller.Item>
      ))}
    </>
  );
}

<VScroller count={2000}>
  <VScroller.Body>
    <YourBody />
  </VScroller.Body>
</VScroller>;
```

### VScroller.Item

`VScroller.Item` component wraps an individual item to be rendered. This expects a `ref` from the child component, which is used to determine the height of the rendered item. (This component is only necessary if you are not using the render prop for the Body component.)

_Examples can be found in the Storybook stories included within this repository._

### Range

Many components reference a `Range` type, which is an object with the following properties:

| Prop  | Type    | Description                                               |
| ----- | ------- | --------------------------------------------------------- |
| start | number  | _Inclusive_ start of the given range of records           |
| end   | number  | _Exclusive_ end of the given range of records             |
| more  | boolean | Indicates whether there are more records after this range |

## Caveats

- This library depends on modern browser features like [IntersectionObserver](https://caniuse.com/#feat=intersectionobserver) and [ResizeObserver](https://caniuse.com/#feat=resizeobserver). This functionality is supported in all modern browsers. Polyfills do exist which may enable this library to work in legacy browsers (i.e. I.E.), however this is untested.
- IntersectionObservers emits notifications asyncronously. This is nice in that it doesn't block the UI thread, but means that there may be a delay between the event occuring and the callback. Because of this, the filler elements may become visible briefly during scrolling - especially when dragging the scrollbar. This can be optimized by experimenting with the `pageSize` and `threshold` properties. It's recommended to use the `fillerStyle` property to give the filler elements a style that will give the user some indication that an update is pending. For example, a checkboard pattern can be seen in the Storybook examples.
- Only supports vertical scrolling, though the concepts could support horizontal scrolling as well.

## TODO

- Some real-world usage, testing, and validation (vet defaults, etc)
- Polish Storybook example site
