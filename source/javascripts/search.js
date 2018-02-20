$(document).ready(function() {
    var index = lunr(function () {
        this.field('title', {boost: 10});
        this.field('content');
        this.ref('url');
    });
    
    $.getJSON('/search.json', function(json) {
        for(var post in json) {
            index.add(json[post]);
        }
        
        var uri = new URI(window.location.search.toString());
        var queryString = uri.search(true);
        if(queryString.hasOwnProperty('q')) {
            var results = index.search(queryString.q.toString()).map(function(result) {
                return json.filter(function(p) { return p.url == result.ref; })[0];
            });
            if(results.length > 0) {
                $('#search-results').html(Mustache.to_html($("#search-results-template").text(), {posts: results}));
            }else if(results.length = 1){
                $('#no-results').html(Mustache.to_html($("#no-results-template").text(), {noposts: results}));
            }
        }
    });
});
