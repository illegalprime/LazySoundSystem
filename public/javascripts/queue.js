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
    $("#results").html(Handlebars.templates['queue/search-results']({ items: data.tracks.items }))
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
