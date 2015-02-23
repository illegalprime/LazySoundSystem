var i = 0;
var queueName = "";

var showButton = function(newQueue) {
    if (newQueue === true) {
        $("#gotoQueue").val("Make a new queue");
    } else if (newQueue === false) {
        $("#gotoQueue").val("Go!");
    }
}

var checkForm = function(e, callback) {
    // Client-side validation
    queueName = $("#name").val() || "";
    var illegalChars = new RegExp("[^A-Za-z0-9-_]");

    if (queueName === "" || illegalChars.exec(queueName)) {
        $("#illegalChars").show();
        if (callback) { callback({error: true}); }
        return false;
    }
    $("#illegalChars").hide();
    // Send to server for Server-side validation
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
        checkForm(e, function(result) {
            console.log(result);
            if (!result && !result.error) {
                $("#gotoQueue").hide();
            } else {
                $("#gotoQueue").show();
            }
        });
    });
    $("#queueInfo").submit(function(e) {
        e.preventDefault();
        checkForm(e, function(result) {
            if (!result || !result.error) {
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
