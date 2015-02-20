var i = 0;

checkForm = function() {
    // Client-side validation
    var name = $("#name").val();
    console.log("hi again" + i++);
    var illegalChars = new RegExp("[^A-Za-z0-9-_]");

    // Send to server for Server-side validation
    // TODO jQuery AJAX request to our own backend

    // TODO more detailed error message once we actually have more
    // data to verify
    if (illegalChars.exec(name)) {
        $("#illegalChars").show();
        return false;
    }
    $("#illegalChars").hide();
    return true;
    // return !illegalChars.exec(name);
}
