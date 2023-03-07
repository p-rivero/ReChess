# ReChess: Chess Reinvented by You

ReChess is an intuitive and easy-to-use chess web app that allows you to create and play your own highly personalized chess variants. It's built with [Vue.js](https://vuejs.org/) and [TypeScript](https://www.typescriptlang.org/), and uses a heavily modified version of the [Protochess engine](https://github.com/p-rivero/protochess-engine) for the game logic.

Check it out at [rechess.org](https://rechess.org)!

---

## Collaborating ❤

### Cloning the Repository

This project uses the `protochess-engine` repo as a submodule. If you haven't cloned this repository with the `--recurse-submodules` option, you can run the following command to clone the submodules:

```sh
git submodule update --init --recursive
```

When pulling changes, I recommend using the `--recurse-submodules` option to make sure you also get the latest changes in the submodules, if any:

```sh
git pull --recurse-submodules
```

Make sure you also have `cargo`, `wasm-pack` and `rustup` installed. The first compilation of the engine might take a while.


### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

### Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Build and Deploy to Firebase

```sh
firebase login
npm run deploy
```

---

## About the license 📜

All files in this repository are licensed under the [MIT License](LICENSE). However, the `protochess-engine` submodule is licensed under the [GNU General Public License v3.0](https://github.com/p-rivero/protochess-engine/blob/master/LICENSE), since it's a fork of [raytran/protochess](https://github.com/raytran/protochess) (which is licensed under the GPL v3.0).

This means that, technically, the project as a whole is licensed under the GPL v3.0, but some parts (namely, the code in this repository) are licensed under the MIT License, which is [GPL-compatible](https://www.gnu.org/licenses/license-list.en.html#Expat). See [this document](https://softwarefreedom.org/resources/2007/gpl-non-gpl-collaboration.html) for more information.

You are free to use the files in this repository under the terms of the MIT License, but if you also clone and use the `protochess-engine` submodule, you must comply with the terms of the GPL v3.0.
