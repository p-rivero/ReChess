# Icons directory

All .svg files in this directory can be used as icons. At compile time, the directory is scanned for .svg files and a corresponding scss file is generated.

## Usage

To use `foo.svg` as an icon, use the `icon-foo` class, combined with `color-white`, `color-black`, `color-primary` or `color-theme` to set the color.

- `color-white` is `$light`.
- `color-black` is `$dark`.
- `color-primary` is `$primary`
- `color-theme` is the opposite of the background color (`color-black` when the theme is light, and `color-white` when the theme is dark).

Example of a white button with a black icon:

```html
<button class="button" @click="onNewClick">
    <span class="icon">
        <div class="icon icon-add color-black"></div>
    </span>
    <span>Add piece</span>
</button>
```
