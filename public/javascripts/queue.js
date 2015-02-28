/**
 * This is the most recently active AJAX query (to Spotify's API).
 * (jQuery ajax object)
 */
var search_req;
/**
 * Most recent search results
 */
var search_res;
/**
 * The newest query typed into the search box.
 * (String)
 */
var newestQuery;
/**
 * Firebase reference TODO: keep this read only
 * queueID is a global variable established in a seperate script
 */
var fb = new Firebase("https://lazysound.firebaseio.com");

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
function updateResults(data) {
    var args = { message: "No results" };
    // TODO the "No results" message shows up when deleting
    // text and the page is too slow updating the `data` object
    // We need to find a way to identify when data is simply lagging
    // vs. actually non-existant (this might be ... really hard?)
    // - Andrew
    if (data && data.tracks.items.length > 0) {
        args = { items: data.tracks.items };
        search_res = data.tracks.items;
    } else if (newestQuery === "") {
        args.message = "";
    }
    $('#results').html(Handlebars.templates['queue/search-results']( args ));
    $('.addSong').on('click', function(e) {
        addSong($(e.target).attr('data-index'));
        $('#search').val("");
        $('#results').slideUp(300, function() {
            searchFor("", updateResults);
        });
    });
}

function addSong(index) {
    var song = search_res[index];
    var cleaned = {
        artist: song.artists[0].name,
        album: song.album.name,
        name: song.name,
        cover: song.album.images[0].url,
        stream: song.external_urls.spotify
    };
    var stringData = JSON.stringify(cleaned);
    $.ajax({
        url: window.location.pathname + "/add",
        type: 'POST',
        data: {
            song: stringData
        },
        success: function(data) {
            console.log("yay! added a song!")
        }
    });
}

/**
 * Initalizes the functionality of this page.
 * This function:
 *  - links together the above functions
 * (`searchFor` and `updateResults`) to DOM events (namely `keyup`
 * events in the search box)
 *  - Render song list from DataSnapshot triggered by changes to
 * Firebase
 */
function init() {
    $('#search').keyup(function() {
        searchFor($('#search').val(), updateResults);
    });
    fb.child("queues/" + queueID).orderByPriority().on('value', function(data) {
        $("#songs").html(Handlebars.templates['queue/songs']({
            songs: data.val()
        }));
        graphicsAdd($('#song-list'), data.val(), 100);
        $('.upvote').click(function() {
            vote('/upvote', $(this));
        });
        $('.downvote').click(function() {
            vote('/downvote', $(this));
        });
        $('.veto').click(function() {
            vote('/veto', $(this));
        });
    });
}

/**
* Handles the upvoting event.
* TODO: queueID and user should be replaced by cookie data.
*/
function vote(url, element) {
    var songID = element.parent().parent().attr('data-song-id');
    $.ajax({
        url: window.location.pathname + url,
        type: 'POST',
        data: {
            songID:  songID,
            user:    "hi"
        }
    });
}

function graphicsAdd(root, songs, speed) {
    var list;
    if (songs) {
        list = $(Handlebars.templates['queue/song']({
            songs: songs
        }));
    }

    list.hide();
    root.append(list);

    (function showItem(element) {
        element.slideDown(speed, function() {
            $(this).next().length && showItem($(this).next());
        });
    })(list.first());
}

if (!document.body) {
    window.onload = init;
}
else init();
