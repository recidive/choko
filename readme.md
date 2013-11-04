# Choko

  Web Application Framework for Node.js. With Choko you can develop complex
  single page web applications within minutes, without requiring any kind of
  rocket science knowledge.

  Choko comes with a build in Content Management System and Framework, so you
  can manage your application and the content related to it on a central place,
  with flexible and powerful APIs.

## Installation

  By now you need to clone the repository:

    $ git clone https://github.com/recidive/choko.git
    $ cd choko
    $ npm install

## Getting started

  Running the examples:

    $ node server.js

  then open http://localhost:3000 in your browser to play with examples.

## Directory structure

```
applications   -> Where all applications live.
  default      -> Default application, all other applications extend this.
    extensions -> Default application extensions.
    public     -> Default application public files.
  example      -> Sample application to show case Choko features.
  [myApp]      -> You app dir should be similar to the example or default app.
lib            -> Choko serverside libraries.
```

The only place it's advised to add or change files is in your own application
folder.

## Coding style

We try to conform to [Felix's Node.js Style Guide](http://nodeguide.com/style.html)
for all of our JavaScript code. For coding documentation we use [JSDoc](http://usejsdoc.org/)
style.
