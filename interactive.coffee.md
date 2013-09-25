Interactive Documentation
=========================

Docco is great for documentation, but what is even greater is being able to
interact with the systems in context. So let's do that.

This interactive documentation is meant to run on an html page and depends on
having access to Zepto or jQuery.

----

A regular non-interactive block quote looks like this:

>     # A regular blockquoted text, won't be interactive

----

An interactive example is blockquoted code with a shebang
on the first line.

The shebang determines what interactive renderer to run, but is not displayed in
the editor.

>     #! echo
>     "I'm an example that echos " +
>     "the result of JavaScript " +
>     "code."

----

Another example illustrating the CoffeeScript compiler.

>     #! coffee
>     (x) -> x * x

----

Implementation
--------------

In order to do that we need to be able to create an editor. The code is the
initial contents of the editor and the destination is what element we should
append it to.

The editor is composed of a text editor where the example code can be modified
and a runtime element where the output can be reported or visualized in real
time.

    createEditor = (code, shebang, destination) ->
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

      destination.after(exampleSection)

      bindUpdates(shebang, editorElement, runtimeElement)

Listen to keyup events from an editor and reflect the changes in the example
instantly.

    bindUpdates = (shebang, editorElement, runtimeElement) ->
      editorElement.on "keyup", ->
        report = ErrorReporter(editorElement)
        source = editorElement.val()

        try
          Interactive.run(shebang, source, runtimeElement)
          report.clear()
        catch e
          report(e)

    readShebang = (source) ->
      if match = (source.match /^\#\! (.*)\n/)
        match[1]

Present any error encountered to the user.

    ErrorReporter = (editor) ->
      reporter = (error) ->

Display errors right next to the editor area.

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

Expose a global object so that we can register runners based on shebangs.

    runners = {}

    (window ? global).Interactive =
      register: (name, runner) ->
        runners[name] = runner

      run: (name, code, element) ->
        runners[name](code, element)

      init: ->

The editor includes an interactive runtime so that changes in the code will be
reflected in the runtime.

We're counting on any blockquoted code to be an interactive example. The
blockquote is removed and the editor is appended.

        $("blockquote > pre > code").each ->
          codeElement = $(this)

          code = codeElement.text()

          if shebang = readShebang(code)
            code = code.split("\n")[1..].join("\n")

            blockQuoteElement = codeElement.parent().parent()

            sectionElement = blockQuoteElement.parent().parent()

            blockQuoteElement.remove()

            createEditor code, shebang, sectionElement

And have a live updating visual display component.

Auto adjust the hegiht of the example textareas.

        $('#container').on('keyup', 'textarea', ->
            $(this).height 0
            $(this).height @scrollHeight
        ).find('textarea').keyup()

A demonstraction runner, treats the example as js and echos the result to a
pre tag.

    Interactive.register "echo", (source, parent) ->
      parent.empty().append $ "<pre>",
        text: eval(source)

    Interactive.register "coffee", (source, parent) ->
      parent.empty().append $ "<pre>",
        text: CoffeeScript.compile(source, bare: true)

We probably want to let whoever includes this call init after they register
their runners.

    Interactive.init()
