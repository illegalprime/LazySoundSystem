var search_req;
var newestQuery;

function searchFor(query, callback) {
    newestQuery = query;
    if (search_req) {
        search_req.abort();
    }
    search_req = $.ajax({
        url:  '/call/spotify/search',
        data: {
            q:    query,
            type: 'track',
            limit: 5
        },
        success: function(data) {
            if (query == newestQuery) {
                callback(JSON.parse(data));
            }
        }
    });
}

function updateHints(data) {
    tracks = data.tracks.items;
    list = "<ol>"
    for (var i = 0; i < tracks.length; ++i) {
        list += "<li><p><a href='"
        + tracks[i].external_urls.spotify + "' />"
        + tracks[i].name + " - "
        + tracks[i].artists[0].name + "</a></p></li>";
    }
    document.getElementById("results").innerHTML = list + "</ol>";
}

function init() {
    $('#search').keyup(function() {
        searchFor($('#search').val(), updateHints);
    });
}

if (!document.body) {
    window.onload = init;
}
else init();
