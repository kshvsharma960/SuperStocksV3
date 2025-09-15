function OnLogin1(data) {
    alert("OnLogin");
    return false;
}

function OnLogin() {
    var user = {};
    user.Email = $("#email").val();
    user.Password = $("#pass").val();

    $.ajax({
        url: "/api/User/authenticate",
        data: JSON.stringify(user),
        type: 'POST',
        contentType: "application/json",
        success: function (data) {            
            console.log("Success");
            window.location.href = data.redirectToUrl;
        }
    });
}