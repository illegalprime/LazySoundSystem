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
 * queueID is a global variable established in a separate script
 */
var fb = new Firebase("https://lazysound.firebaseio.com");
/**
 * Most recent JSON of queue to hold past data so we can check what changed
 * when firebase gives us an update.
 */
var oldqueue;

/**
 * Takes a query and a callback and sends the result (from a Spotify API
 * call) as a JSON object to the callback function.
 *
 * @param query - search query for Spotify
 * @param callback - recipient of the data from Spotify
 */
function searchFor(query, callback) {
    newestQuery = query;
    // If there is an exisiting/active search request,
    // cancel it before continuing
    if (search_req) {
        search_req.abort();
    }
    if (!query || query == "") {
        callback();
        return;
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
    // Can't replicate this issue anymore... Might investigate
    // further later...
    // - Future Andrew (6/16)
    if (data && data.tracks.items.length > 0) {
        args = { items: data.tracks.items };
        search_res = data.tracks.items;
    } else if (newestQuery === "") {
        args.message = "";
    }
    // Render the precompiled Handlebars templates and then set them
    // as the html of the $('#results') DOM object
    $('#results')
      .html(Handlebars.templates['queue/search-results']( args ))
      .slideDown(300);

    // Need to re-add the "on-click" listener to newly-made results
    // in order to add new songs from newly generated search results
    $('.addSong').on('click', function(e) {
        addSong($(e.target).attr('data-index'));
        // After a song is added, collapse and remove the search
        // results element from the page and clear the search results.
        $('#results').slideUp(300, function() {
            clearSearch();
        });
    });
}


/**
 * Clears the search query from the screen and also any related data
 * in the search params in javascript.
 * This function will
 *  1) cancel any existing search requests (search_req)
 *  2) set the newestQuery to ""
 *  and 3) set the DOM search box to ""
 */
function clearSearch() {
  if (search_req) { search_req.abort(); }
  newestQuery = "";
  $('#search').val("");
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
        // diff(data.val());

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

/**
 * Find the difference between queues and apply them to the UI
 */
function diff(curr) {
    console.log(curr);
    if (!oldqueue) {
        oldqueue = curr;
        return;
    }
    var oldkeys = Object.keys(oldqueue);
    var newkeys = Object.keys(curr);

    for (var i = 0, j = 0; i < oldkeys.length && j < newkeys.length;) {
        if (oldkeys[i] == newkeys[j]) {
            ++i, ++j;
        }
        else if (oldkeys[i] > newkeys[j]) {
            do {
                console.log('Added: ' + newkeys[j]);
                ++j;
            } while (oldkeys[i] > newkeys[j]);
        }
        else if (oldkeys[i] < newkeys[j]) {
            do {
                console.log('Removed: ' + oldkeys[i]);
                ++i;
            } while (oldkeys[i] < newkeys[j]);
        }
    }
}

/**
 * Removes an element from the list, animating it.
 */
function graphicsRemove(item, speed) {
    item.slideUp(speed, function() {
        $(this).remove();
    });
}

/**
 * Adds a list of songs to the queue with animations
 * can add one song at a specific place making what is
 * happening to the queue clearer.
 */
function graphicsAdd(root, songs, speed) {
    var list;
    if (songs) {
        list = $(Handlebars.templates['queue/song2']({
            songs: songs
        }));
    }
    else {
        list = $('<li></li>');
    }

    list.hide();
    root.append(list);

    (function showItem(element) {
        element.slideDown(speed, function() {
            $(this).next().length && showItem($(this).next());
        });
    })(list.first());
}

/**
 * Moves an element up or down some in the queue, graphically
 */
function graphicsMove(item, dy) {

}

if (!document.body) {
    window.onload = init;
}
else init();
