---
layout: post
title: "Building Elenco"
date: 2014-01-24
---

Earlier this month, I had an idea: build a simple tool to help me stay productive while browsing the internet. While the concept of a product already existed elsewhere in the digital realm (Clear, Any.do &#38; many others), I did some research and I couldn’t find a well-designed in browser todo app.

After reaching out to a friend, [TJ Krusinski](https://twitter.com/TJkrusinski), to help build, we jumped straight into code to get it out. We called it [Elenco](http://drocarmo.com/elenco/) (lists in Italian).

### Writing A Chrome App

I use Chrome as my default browser, it has amazing developer tools, it’s platform independent and is a leader in browser language specifications and compatibility.

TJ and I did some research into what Chrome actually needs from our app to parse the data and interface we want to display on a user’s screen. Chrome uses a json file called ‘manifest’ to parse all the data coming through our code.

It looks something like this:

```
{

    "manifest_version": 2,
    "name": "Elenco",
    "description":"Elenco helps you stay on track",
    "version":"0.1",
    "permissions": [
        "storage"
    ],

   "icons": {
        "16":"/assets/images/icon-16.png",
        "48":"/assets/images/icon-48.png",
        "128":"/assets/images/icon-128.png"
    },

    "browser_action": {
        "default_title":"Elenco",
        "default_icon":"/assets/images/icon.png"
    },

    "chrome_url_overrides": {
        "newtab":"index.html"
    }

}
```

As you can see, I’m telling chrome two important things: allow permission for local storage, and override every new tab with Elenco’s interface. The rest is up to us. I built the front-end interface while TJ cranked out all the heavy API lifting.

Elenco is [live](http://goo.gl/doYTHi) and [open-sourced](https://github.com/drocarmo/elenco). Hit us up if you find a bug or have any features requests.