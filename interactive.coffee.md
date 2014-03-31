Interactive Documentation
=========================

Docco is great for documentation within the context of the implementation, but
what is even greater is being able to interact with the systems we create within
the entirety of their context. So let's do it. Let's go all the way.

Before you stands a simple interactive editor that echos the result of its
JavaScript code into the output area on the right.

>     #! echo
>     "I'm an example that echos " +
>     "the result of JavaScript " +
>     "code."

----

An interactive example is created from blockquoted code sections in your
literate coding style files. The trick to making it interactive is adding a
shebang on the first line.

The shebang determines what interactive renderer to run, but is not displayed in
the editor.

----

>     #! shebang
>     If the shebang is not known, the example
>     simply remains as blockquoted text.

----

Registering handlers
--------------------

In order for these editors to work we need to register the handlers to create
them.

Here we bind the `echo` handler:

>     #! setup
>     Interactive.register "echo", ({source, runtimeElement}) ->
>       runtimeElement.empty().append $ "<pre>",
>         text: eval(source)

----

Here we bind the `coffee` handler:

>     #! setup
>     Interactive.register "coffee", ({source, runtimeElement}) ->
>       runtimeElement.empty().append $ "<pre>",
>         text: CoffeeScript.compile(source, bare: true)

----

In your own documentation it is probably better to register your handlers near
the bottom because you wouldn't want them to distract from the primary goal of
your project.

Implementation
--------------

The primary thing that we need to be able to do is create an editor. The code
is the initial contents of the editor, the `shebang` is what runtime to execute,
and the `section` is the section element this editor came from.

We append the interactive widget after section the editor came from so that
it can span the whole screen and won't interfere with any comments or code.

You may have noticed looking through the source that there are many section
breaks. This keeps the editors from getting weird, which they will do if there
are two editors created from in the same section.

The editor is composed of a text editor where the example code can be modified
and a runtime element where the output can be reported or visualized in real
time.

    createEditor = (code, shebang, section) ->
      exampleSection = $ "<li>",
        class: "example"

      annotationElement = $ "<div>",
        class: "annotation"

      editorElement = $ "<textarea>",
        class: "annotation"
        text: code

      contentElement = $ "<div>",
        class: "content"

      runtimeElement = $ "<div>",
        class: "output"

      contentElement.append(runtimeElement)

      annotationElement.append(editorElement)
      exampleSection.append(annotationElement)
      exampleSection.append(contentElement)

      section.after(exampleSection)

      bindUpdates(shebang, editorElement, runtimeElement)

Listen to keyup events from an editor and reflect the changes in the example
instantly.

    bindUpdates = (shebang, editorElement, runtimeElement) ->
      editorElement.on "keyup", ->
        report = ErrorReporter(editorElement)
        source = editorElement.val()

        try
          runners[shebang]({
            editorElement
            source
            runtimeElement
          })
          report.clear()
        catch e
          report(e)

A helper to pull the `shebang` from the sample code areas.

    readShebang = (source) ->
      if match = (source.match /^\#\! (.*)\n/)
        match[1]

Present any error encountered to the user and display them right next to the
editor area.

    ErrorReporter = (editor) ->
      reporter = (error) ->
        if editor.next().is("p.error")
          editor.next().text(error)
        else
          errorParagraph = $ "<p>",
            class: "error"
            text: error.toString()

          editor.after(errorParagraph)

      reporter.clear = ->
        if editor.next().is("p.error")
          editor.next().remove()

      return reporter

The editor includes an interactive runtime so that changes in the code will be
reflected in the runtime.

We're counting on any blockquoted code to be an interactive example. The
blockquote is removed and the editor is appended.

    findInteractiveElements = ->
      $("blockquote > pre > code").each ->
        codeElement = $(this)

        code = codeElement.text()

        if shebang = readShebang(code)
          # Skip any we don't know about right now, we may know about them later
          return unless runners[shebang]

          code = code.split("\n")[1..].join("\n")

          blockQuoteElement = codeElement.parent().parent()

          sectionElement = blockQuoteElement.parent().parent()

          blockQuoteElement.remove()

          createEditor code, shebang, sectionElement

Expose a global object so that we can register runners based on shebangs.

    runners = {}

    (window ? global).Interactive =
      register: (name, runner) ->
        runners[name] = runner

        findInteractiveElements()

And have a live updating visual display component.

Auto adjust the hegiht of the example textareas.

        $('#container').on('keyup', 'textarea', ->
            $(this).height 0
            $(this).height @scrollHeight
        ).find('textarea').keyup()

To make docs interactive they need to register their own handlers. They can do
this through one of the two bootstrap handlers available.

    exec = ({source, code, editorElement, runtimeElement}) ->
      runtimeElement.parent().remove()
      editorElement.replaceWith $ "<pre>",
        text: source

      setTimeout ->
        Function(code)()
      , 0

Once the document is loaded we register our handlers. Any time a new handler is
registered `findInteractiveElements` is called again to create any interactive
editors that may match it. This will then bootstrap any user defined handlers.

    $ ->

`setup` executes the given block of CoffeeScript code. Use this to register your
own handlers that run during the viewing of your documentation.

      Interactive.register "setup", (params) ->
        params.code = CoffeeScript.compile(params.source)
        exec params

`setup-js` can be used to execute JS code handlers rather than CoffeeScript

      Interactive.register "setup-js", (params) ->
        params.code = params.source
        exec params

Special Thanks
--------------

- Alan Kay
- Bret Victor
- Jeremy Ashkenas

... and tons of others who have cared enough about what computing is supposed
to be rather that what it is.

Final Thoughts
--------------

Living things are interesting, software shouldn't be dead.
