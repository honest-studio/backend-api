# On Parsing Things
Wikipedia's API returns a.. variant of HTML. The `wtf_wikipedia` library, which we are extending, does a pretty good job of tokenizing this into a clean JSON format, which I have described in `article-dto.ts`.

We will walk through an example using The Hunger Games.

First, we need to obtain the bastard WikiText version of the article, which can be obtained via bulk import with WikiMedia tools, or via the Wikipedia REST API. [Example REST Request](https://en.wikipedia.org/w/api.php?action=query&redirects=true&prop=revisions&rvprop=content&maxlag=5&format=json&origin=*&titles=The%20Hunger%20Games)

Taking that JSON response and passing it to our parser, we get the cleaned JSON output. The cleaned output for this example (The Hunger Games) is in `hunger-games.json`. With wtf_wikipedia and the variant that we're building out, we can store this clean JSON, send it over the wire to the client, and render it into standard Markdown on the client side. An example of the Markdown output based on that JSON is shown in `hunger-games.md`.

Rendering Markdown from clean JSON on the client side lets us extend the functionality as we go without having to worry about persistence, since the clean JSON is basically an AST. This aligns well to the approach used in Slate, which we are using to build the editor- everything is a tree.