(function(pkg) {
  // Expose a require for our package so scripts can access our modules
  window.require = Require.generateFor(pkg);
})({
  "version": "0.8.1",
  "source": {
    "interactive.coffee.md": {
      "path": "interactive.coffee.md",
      "mode": "100644",
      "content": "Interactive Documentation\n=========================\n\nDocco is great for documentation within the context of the implementation, but\nwhat is even greater is being able to interact with the systems we create within\nthe entirety of their context. So let's do it. Let's go all the way.\n\nBefore you stands a simple interactive editor that echos the result of its\nJavaScript code into the output area on the right.\n\n>     #! echo\n>     \"I'm an example that echos \" +\n>     \"the result of JavaScript \" +\n>     \"code.\"\n\n----\n\nAn interactive example is created from blockquoted code sections in your\nliterate coding style files. The trick to making it interactive is adding a\nshebang on the first line.\n\nThe shebang determines what interactive renderer to run, but is not displayed in\nthe editor.\n\n----\n\n>     #! shebang\n>     If the shebang is not known, the example\n>     simply remains as blockquoted text.\n\n----\n\nRegistering handlers\n--------------------\n\nIn order for these editors to work we need to register the handlers to create\nthem.\n\nHere we bind the `echo` handler:\n\n>     #! setup\n>     Interactive.register \"echo\", ({source, runtimeElement}) ->\n>       runtimeElement.empty().append $ \"<pre>\",\n>         text: eval(source)\n\n----\n\nHere we bind the `coffee` handler:\n\n>     #! setup\n>     Interactive.register \"coffee\", ({source, runtimeElement}) ->\n>       runtimeElement.empty().append $ \"<pre>\",\n>         text: CoffeeScript.compile(source, bare: true)\n\n----\n\nIn your own documentation it is probably better to register your handlers near\nthe bottom because you wouldn't want them to distract from the primary goal of\nyour project.\n\nImplementation\n--------------\n\nThe primary thing that we need to be able to do is create an editor. The code\nis the initial contents of the editor, the `shebang` is what runtime to execute,\nand the `section` is the section element this editor came from.\n\nWe append the interactive widget after section the editor came from so that\nit can span the whole screen and won't interfere with any comments or code.\n\nYou may have noticed looking through the source that there are many section\nbreaks. This keeps the editors from getting weird, which they will do if there\nare two editors created from in the same section.\n\nThe editor is composed of a text editor where the example code can be modified\nand a runtime element where the output can be reported or visualized in real\ntime.\n\n    createEditor = (code, shebang, section) ->\n      exampleSection = $ \"<li>\",\n        class: \"example\"\n\n      annotationElement = $ \"<div>\",\n        class: \"annotation\"\n\n      editorElement = $ \"<textarea>\",\n        class: \"annotation\"\n        text: code\n\n      contentElement = $ \"<div>\",\n        class: \"content\"\n\n      runtimeElement = $ \"<div>\",\n        class: \"output\"\n\n      contentElement.append(runtimeElement)\n\n      annotationElement.append(editorElement)\n      exampleSection.append(annotationElement)\n      exampleSection.append(contentElement)\n\n      section.after(exampleSection)\n\n      bindUpdates(shebang, editorElement, runtimeElement)\n\nListen to keyup events from an editor and reflect the changes in the example\ninstantly.\n\n    bindUpdates = (shebang, editorElement, runtimeElement) ->\n      editorElement.on \"keyup\", ->\n        report = ErrorReporter(editorElement)\n        source = editorElement.val()\n\n        try\n          runners[shebang]({\n            editorElement\n            source\n            runtimeElement\n          })\n          report.clear()\n        catch e\n          report(e)\n\nA helper to pull the `shebang` from the sample code areas.\n\n    readShebang = (source) ->\n      if match = (source.match /^\\#\\! (.*)\\n/)\n        match[1]\n\nPresent any error encountered to the user and display them right next to the\neditor area.\n\n    ErrorReporter = (editor) ->\n      reporter = (error) ->\n        if editor.next().is(\"p.error\")\n          editor.next().text(error)\n        else\n          errorParagraph = $ \"<p>\",\n            class: \"error\"\n            text: error.toString()\n\n          editor.after(errorParagraph)\n\n      reporter.clear = ->\n        if editor.next().is(\"p.error\")\n          editor.next().remove()\n\n      return reporter\n\nThe editor includes an interactive runtime so that changes in the code will be\nreflected in the runtime.\n\nWe're counting on any blockquoted code to be an interactive example. The\nblockquote is removed and the editor is appended.\n\n    findInteractiveElements = ->\n      $(\"blockquote > pre > code\").each ->\n        codeElement = $(this)\n\n        code = codeElement.text()\n\n        if shebang = readShebang(code)\n          # Skip any we don't know about right now, we may know about them later\n          return unless runners[shebang]\n\n          code = code.split(\"\\n\")[1..].join(\"\\n\")\n\n          blockQuoteElement = codeElement.parent().parent()\n\n          sectionElement = blockQuoteElement.parent().parent()\n\n          blockQuoteElement.remove()\n\n          createEditor code, shebang, sectionElement\n\nExpose a global object so that we can register runners based on shebangs.\n\n    runners = {}\n\n    (window ? global).Interactive =\n      register: (name, runner) ->\n        runners[name] = runner\n\n        findInteractiveElements()\n\nAnd have a live updating visual display component.\n\nAuto adjust the hegiht of the example textareas.\n\n        $('#container').on('keyup', 'textarea', ->\n            $(this).height 0\n            $(this).height @scrollHeight\n        ).find('textarea').keyup()\n\nTo make docs interactive they need to register their own handlers. They can do\nthis through one of the two bootstrap handler available.\n\n    exec = ({source, code, editorElement, runtimeElement}) ->\n      runtimeElement.remove()\n      editorElement.replaceWith $ \"<pre>\",\n        text: source\n\n      setTimeout ->\n        Function(code)()\n      , 0\n\n`setup` executes the given block of CoffeeScript code. Use this to register your\nown handlers that run during the viewing of your documentation.\n\n    Interactive.register \"setup\", (params) ->\n      params.code = CoffeeScript.compile(params.source)\n      exec params\n\n`setup-js` can be used to execute JS code handlers rather than CoffeeScript\n\n    Interactive.register \"setup-js\", (params) ->\n      params.code = params.source\n      exec params\n\nWe need to call `findInteractiveElements` at least once to get everything\nstarted. This will find any `setup` or `setup-js` handlers and execute them.\n\nWe want to make sure to wait until the document is loaded first though.\n\nAny time a new handler is registered `findInteractiveElements` is called again\nto create any interactive editors that may match it.\n\n    $ ->\n      findInteractiveElements()\n\nSpecial Thanks\n--------------\n\n- Alan Kay\n- Bret Victor\n- Jeremy Ashkenas\n\n... and tons of others who have cared enough about what computing is supposed\nto be rather that what it is.\n\nFinal Thoughts\n--------------\n\nLiving things are interesting, software shouldn't be dead.\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.8.1\"\nentryPoint: \"interactive\"\nremoteDependencies: [\n  \"http://strd6.github.io/require/v0.2.0.js\"\n]\n",
      "type": "blob"
    }
  },
  "distribution": {
    "interactive": {
      "path": "interactive",
      "content": "(function() {\n  var ErrorReporter, bindUpdates, createEditor, exec, findInteractiveElements, readShebang, runners;\n\n  createEditor = function(code, shebang, section) {\n    var annotationElement, contentElement, editorElement, exampleSection, runtimeElement;\n    exampleSection = $(\"<li>\", {\n      \"class\": \"example\"\n    });\n    annotationElement = $(\"<div>\", {\n      \"class\": \"annotation\"\n    });\n    editorElement = $(\"<textarea>\", {\n      \"class\": \"annotation\",\n      text: code\n    });\n    contentElement = $(\"<div>\", {\n      \"class\": \"content\"\n    });\n    runtimeElement = $(\"<div>\", {\n      \"class\": \"output\"\n    });\n    contentElement.append(runtimeElement);\n    annotationElement.append(editorElement);\n    exampleSection.append(annotationElement);\n    exampleSection.append(contentElement);\n    section.after(exampleSection);\n    return bindUpdates(shebang, editorElement, runtimeElement);\n  };\n\n  bindUpdates = function(shebang, editorElement, runtimeElement) {\n    return editorElement.on(\"keyup\", function() {\n      var e, report, source;\n      report = ErrorReporter(editorElement);\n      source = editorElement.val();\n      try {\n        runners[shebang]({\n          editorElement: editorElement,\n          source: source,\n          runtimeElement: runtimeElement\n        });\n        return report.clear();\n      } catch (_error) {\n        e = _error;\n        return report(e);\n      }\n    });\n  };\n\n  readShebang = function(source) {\n    var match;\n    if (match = source.match(/^\\#\\! (.*)\\n/)) {\n      return match[1];\n    }\n  };\n\n  ErrorReporter = function(editor) {\n    var reporter;\n    reporter = function(error) {\n      var errorParagraph;\n      if (editor.next().is(\"p.error\")) {\n        return editor.next().text(error);\n      } else {\n        errorParagraph = $(\"<p>\", {\n          \"class\": \"error\",\n          text: error.toString()\n        });\n        return editor.after(errorParagraph);\n      }\n    };\n    reporter.clear = function() {\n      if (editor.next().is(\"p.error\")) {\n        return editor.next().remove();\n      }\n    };\n    return reporter;\n  };\n\n  findInteractiveElements = function() {\n    return $(\"blockquote > pre > code\").each(function() {\n      var blockQuoteElement, code, codeElement, sectionElement, shebang;\n      codeElement = $(this);\n      code = codeElement.text();\n      if (shebang = readShebang(code)) {\n        if (!runners[shebang]) {\n          return;\n        }\n        code = code.split(\"\\n\").slice(1).join(\"\\n\");\n        blockQuoteElement = codeElement.parent().parent();\n        sectionElement = blockQuoteElement.parent().parent();\n        blockQuoteElement.remove();\n        return createEditor(code, shebang, sectionElement);\n      }\n    });\n  };\n\n  runners = {};\n\n  (typeof window !== \"undefined\" && window !== null ? window : global).Interactive = {\n    register: function(name, runner) {\n      runners[name] = runner;\n      findInteractiveElements();\n      return $('#container').on('keyup', 'textarea', function() {\n        $(this).height(0);\n        return $(this).height(this.scrollHeight);\n      }).find('textarea').keyup();\n    }\n  };\n\n  exec = function(_arg) {\n    var code, editorElement, runtimeElement, source;\n    source = _arg.source, code = _arg.code, editorElement = _arg.editorElement, runtimeElement = _arg.runtimeElement;\n    runtimeElement.remove();\n    editorElement.replaceWith($(\"<pre>\", {\n      text: source\n    }));\n    return setTimeout(function() {\n      return Function(code)();\n    }, 0);\n  };\n\n  Interactive.register(\"setup\", function(params) {\n    params.code = CoffeeScript.compile(params.source);\n    return exec(params);\n  });\n\n  Interactive.register(\"setup-js\", function(params) {\n    params.code = params.source;\n    return exec(params);\n  });\n\n  $(function() {\n    return findInteractiveElements();\n  });\n\n}).call(this);\n\n//# sourceURL=interactive.coffee",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.8.1\",\"entryPoint\":\"interactive\",\"remoteDependencies\":[\"http://strd6.github.io/require/v0.2.0.js\"]};",
      "type": "blob"
    }
  },
  "entryPoint": "interactive",
  "dependencies": {},
  "remoteDependencies": [
    "http://strd6.github.io/require/v0.2.0.js"
  ],
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "repository": {
    "id": 13078696,
    "name": "interactive",
    "full_name": "STRd6/interactive",
    "owner": {
      "login": "STRd6",
      "id": 18894,
      "avatar_url": "https://2.gravatar.com/avatar/33117162fff8a9cf50544a604f60c045?d=https%3A%2F%2Fidenticons.github.com%2F39df222bffe39629d904e4883eabc654.png&r=x",
      "gravatar_id": "33117162fff8a9cf50544a604f60c045",
      "url": "https://api.github.com/users/STRd6",
      "html_url": "https://github.com/STRd6",
      "followers_url": "https://api.github.com/users/STRd6/followers",
      "following_url": "https://api.github.com/users/STRd6/following{/other_user}",
      "gists_url": "https://api.github.com/users/STRd6/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/STRd6/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/STRd6/subscriptions",
      "organizations_url": "https://api.github.com/users/STRd6/orgs",
      "repos_url": "https://api.github.com/users/STRd6/repos",
      "events_url": "https://api.github.com/users/STRd6/events{/privacy}",
      "received_events_url": "https://api.github.com/users/STRd6/received_events",
      "type": "User",
      "site_admin": false
    },
    "private": false,
    "html_url": "https://github.com/STRd6/interactive",
    "description": "Interactive demos built into Docco style documentation",
    "fork": false,
    "url": "https://api.github.com/repos/STRd6/interactive",
    "forks_url": "https://api.github.com/repos/STRd6/interactive/forks",
    "keys_url": "https://api.github.com/repos/STRd6/interactive/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/STRd6/interactive/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/STRd6/interactive/teams",
    "hooks_url": "https://api.github.com/repos/STRd6/interactive/hooks",
    "issue_events_url": "https://api.github.com/repos/STRd6/interactive/issues/events{/number}",
    "events_url": "https://api.github.com/repos/STRd6/interactive/events",
    "assignees_url": "https://api.github.com/repos/STRd6/interactive/assignees{/user}",
    "branches_url": "https://api.github.com/repos/STRd6/interactive/branches{/branch}",
    "tags_url": "https://api.github.com/repos/STRd6/interactive/tags",
    "blobs_url": "https://api.github.com/repos/STRd6/interactive/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/STRd6/interactive/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/STRd6/interactive/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/STRd6/interactive/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/STRd6/interactive/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/STRd6/interactive/languages",
    "stargazers_url": "https://api.github.com/repos/STRd6/interactive/stargazers",
    "contributors_url": "https://api.github.com/repos/STRd6/interactive/contributors",
    "subscribers_url": "https://api.github.com/repos/STRd6/interactive/subscribers",
    "subscription_url": "https://api.github.com/repos/STRd6/interactive/subscription",
    "commits_url": "https://api.github.com/repos/STRd6/interactive/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/STRd6/interactive/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/STRd6/interactive/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/STRd6/interactive/issues/comments/{number}",
    "contents_url": "https://api.github.com/repos/STRd6/interactive/contents/{+path}",
    "compare_url": "https://api.github.com/repos/STRd6/interactive/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/STRd6/interactive/merges",
    "archive_url": "https://api.github.com/repos/STRd6/interactive/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/STRd6/interactive/downloads",
    "issues_url": "https://api.github.com/repos/STRd6/interactive/issues{/number}",
    "pulls_url": "https://api.github.com/repos/STRd6/interactive/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/STRd6/interactive/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/STRd6/interactive/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/STRd6/interactive/labels{/name}",
    "releases_url": "https://api.github.com/repos/STRd6/interactive/releases{/id}",
    "created_at": "2013-09-24T22:53:30Z",
    "updated_at": "2013-10-01T01:10:43Z",
    "pushed_at": "2013-10-01T01:10:43Z",
    "git_url": "git://github.com/STRd6/interactive.git",
    "ssh_url": "git@github.com:STRd6/interactive.git",
    "clone_url": "https://github.com/STRd6/interactive.git",
    "svn_url": "https://github.com/STRd6/interactive",
    "homepage": null,
    "size": 1412,
    "stargazers_count": 0,
    "watchers_count": 0,
    "language": "CoffeeScript",
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 0,
    "forks": 0,
    "open_issues": 0,
    "watchers": 0,
    "default_branch": "master",
    "master_branch": "master",
    "permissions": {
      "admin": true,
      "push": true,
      "pull": true
    },
    "network_count": 0,
    "subscribers_count": 1,
    "branch": "master",
    "defaultBranch": "master"
  }
});