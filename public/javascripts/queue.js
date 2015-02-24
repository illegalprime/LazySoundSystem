/**
 * This is the most recently active AJAX query (to Spotify's API).
 * (jQuery ajax object)
 */
var search_req;
/**
 * The newest query typed into the search box.
 * (String)
 */
var newestQuery;

/**
 * Takes a query and a callback and sends the result (from a Spotify API
 * call) as a JSON object to the callback function.
 *
 * @param query - search query for Spotify
 * @param callback - recipient of the data from Spotify
 */
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
        type: "POST",
        success: function(data) {
            if (query == newestQuery) {
                callback(JSON.parse(data));
            }
        }
    });
}

/**
 * This function will update the results displayed on screen as the
 * user types into the search box. If there are no results then
 * that will be indicated.
 *
 * This uses the `queue/search-results` Handlebars template to do the
 * actual rendering client-side. It is located in the
 * `shared/templates/queue/` folder.
 *
 * @param data - data object sent from the `searchFor` method above
 * this is the format defined by Spotify's API.
 */
function updateHints(data) {
    var args = { message: "No results" };
    // TODO the "No results" message shows up when deleting
    // text and the page is too slow updating the `data` object
    // We need to find a way to identify when data is simply lagging
    // vs. actually non-existant (this might be ... really hard?)
    // - Andrew
    if (data && data.tracks.items.length > 0) {
        args = { items: data.tracks.items };
    }
    $("#results").html(Handlebars.templates['queue/search-results']( args ))

}

/**
 * Initalizes the functionality of this page.
 * (As of now - 2/17/2015) this function links together the above
 * functions (`searchFor` and `updateHints`) to DOM events (namely
 * `keyup` events in the search box).
 */
function init() {
    $('#search').keyup(function() {
        searchFor($('#search').val(), updateHints);
    });
}

if (!document.body) {
    window.onload = init;
}
else init();
