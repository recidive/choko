# ![Choko](https://raw.github.com/recidive/choko/master/applications/default/public/img/logo.png)

  Web Application Framework for Node.js. With Choko you can develop complex
  single page web applications within minutes, without requiring any kind of
  rocket science knowledge.

  Choko comes with a build in Content Management System and Framework, so you
  can manage your application and the content related to it on a central place,
  with flexible and powerful APIs.

## Demo application

  You can see Choko in action at [demo.choko.org](http://demo.choko.org).

## Installation

  > **Please note:** since Choko is under very active development, to have
  access to the latest functionality, it's advised to install Choko from the
  sources. For instructions on how to do this, please refer to the [Installing
  from the sources](#installing-from-the-sources) section bellow.

  You can install the latest version of Choko globally using
  [NPM](http://npmjs.org):

    sudo npm install -g choko

## Dependencies

  Choko depends on [Node.js](http://nodejs.org), [NPM](http://npmjs.org) and
  [MongoDB](http://www.mongodb.org).

## Getting started

  To create your first application with Choko, you should call the choko
  command passing a folder name or path that will be your application root
  folder.

    choko myApp

  Then follow the steps to have access to the installer.

## Update

  To update to the latest version of Choko you can run:

    sudo npm update -g choko

## Installing from the sources

  If you have some specific development needs, or you want to be involved with
  Choko core development, you might want to install and run Choko from the
  sources. In order to do so, you can clone the repository and build Choko by
  hand.

    git clone https://github.com/recidive/choko.git
    cd choko
    npm install
    bower install

  Now you can start the Choko server by going to the choko main folder and
  running it.

    node server.js myApp

  You can also run it using the choko script like this:

    bin/choko

## Directory structure

```
applications   -> Where core applications live.
  default      -> Default application, all other applications extend this.
    extensions -> Default application extensions.
    public     -> Default application public files.
  example      -> Sample application to show case Choko features.
lib            -> Choko serverside libraries.
```

The only place it's advised to add or change files is in your own applications
repository folder.

## Coding style

We try to conform to [Felix's Node.js Style Guide](https://github.com/felixge/node-style-guide)
for all of our JavaScript code. For coding documentation we use [JSDoc](http://usejsdoc.org/)
style.
