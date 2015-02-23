var i = 0;
var queueName;

var checkForm = function(e, callback) {
    // Client-side validation
    queueName = $("#name").val();
    console.log("hi again" + i++ + " " + queueName);
    var illegalChars = new RegExp("[^A-Za-z0-9-_]");

    if (illegalChars.exec(queueName)) {
        $("#illegalChars").show();
        if (callback) { callback(false); }
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
                console.log(result.error);
                $("#illegalChars").show();
            } else {
                console.log(result.unique);
                if (result.unique) { $("#makeNewQueue").show(); }
                else { $("#makeNewQueue").hide(); }
            }
            if (callback) { callback(result.error); }
        }, error: function(data) {
            console.error("broken!");
            if (callback) { callback(false); }
        }
    });
}

var init = function() {
    $("#queueInfo").submit(function(e) {
        e.preventDefault();
        checkForm(e);
    });
    $("#makeNewQueue").submit(function(e) {
        e.preventDefault();
        checkForm(e, function(valid) {
            if (valid) {
                $("#makeNewQueue")
                .append("<input type='hidden' name='ame' value='" +
                    queueName + "'>").submit();
            }
        });
    })
}


if (!document.body) {
    window.onload = init;
}
else init();
