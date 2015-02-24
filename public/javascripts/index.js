/**
 * Changes the text of the button based on whether or not
 * the name for the queue is new or not
 *
 * @param newQueue - boolean value representing whether or not
 * the name is unique
 *
 */
var showButton = function(newQueue) {
    if (newQueue === true) {
        $("#gotoQueue").val("Make a new queue");
    } else if (newQueue === false) {
        $("#gotoQueue").val("Go!");
    }
}

/**
 * Does client and then server side validation on queue names
 * tests for illegal characters client side and then checks
 * server side for validity and uniqueness.
 *
 * Queue names are read directly from the DOM and not passed
 * directly into this function.
 *
 * @param callback - function that is sent a `result` object
 * describing the results of the tests. `result.error` will
 * contain the details (if any) of the name
 */
var checkForm = function(callback) {
    // Read data from DOM (value of `#name`)
    var queueName = $("#name").val() || "";

    // Client-side validation
    var illegalChars = new RegExp("[^A-Za-z0-9-_]");
    if (queueName === "" || illegalChars.exec(queueName)) {
        $("#illegalChars").show();
        if (callback) { callback({error: true}); }
        return false;
    }
    $("#illegalChars").hide();

    // Send to backend for Server-side validation
    $.ajax({
        url:  '/',
        data: { name: queueName },
        method: "POST",
        success: function(result) {
            if (result.error) {
                $("#illegalChars").show();
            } else {
                if (result.unique) { showButton(true); }
                else { showButton(false); }
            }
            if (callback) { callback(result); }
        }, error: function(data) {
            if (callback) { callback(data); }
        }
    });
}

var init = function() {
    $("#name").keyup(function(e) {
        checkForm(function(result) {
            if ($("#name").val() != "" && result.error) {
                $("#gotoQueue").hide();
            } else {
                $("#gotoQueue").show();
                $("#illegalChars").hide();
            }
        });
    });
    $("#queueInfo").submit(function(e) {
        e.preventDefault();
        checkForm(function(result) {
            if (!result.error) {
                $("#queueInfo").unbind('submit');
                $("#queueInfo").submit();
            }
        });
    });
}


if (!document.body) {
    window.onload = init;
}
else init();
