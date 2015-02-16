var search_req;
var newestQuery;

function searchFor(query, callback) {
    newestQuery = query;
    if (!query || query == "") {
        callback();
        return;
    }
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

// `data` is the string from the search box passed here
// by `searchFor`(our own function def'd above) as a
// parameter for its callback function
function updateHints(data) {
    var list = "<ol>";
    if (!data || !data.tracks) {
        list = "";
    }
    else if (data.tracks.items.length == 0) {
        // no results for your search
        list = "No results";
    }
    else {
        tracks = data.tracks.items;
        for (var i = 0; i < tracks.length; ++i) {
            list += "<li><p><a href='"
            + tracks[i].external_urls.spotify + "' target='_newtab'>"
            + tracks[i].name + " - "
            + tracks[i].artists[0].name + "</a></p></li>";
        }
        list += "</ol>";
    }
    $("#results").html(list);
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
