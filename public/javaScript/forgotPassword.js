// For handling error in email of forgot password form 
$(function(){
    $('#forgotPasswordform').on('submit', function(e) {
        if(this.checkValidity() == false) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass("was-validated");
        } 
    }); 
});

// For handling error in password form 
$(function(){
    $('#resetPasswordform').on('submit', function(e) {
        if(this.checkValidity() == false) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass("was-validated");
        } 
    });
});

// To ckeck equality of password and confirmed password
$("#password, #confirmPassword").on("keyup", function () {
  if ($("#password").val() != $("#confirmPassword").val()) {
    $("#password-same").removeClass("d-none");
    $(".signUpDisabled").attr("disabled", true);
  } else {
    $("#password-same").addClass("d-none");
    $(".signUpDisabled").removeAttr("disabled");
  }
});

// show password
$(function(){
    $('#checkbox').on('click', function(e) {
        const x = $("#confirmPassword");
        const y = $("#password");
        const label = $("#label");
        const showPassword = 'Show Password';
        const hidePassword = 'Hide Password';
        console.log(label);
        if ($('#checkbox').is(":checked") === true) {
            x.prop('type', 'text');
            y.prop("type", "text");
            label.html(hidePassword);
        } else {
            x.prop("type", "password");
            y.prop("type", "password");
            label.html(showPassword);
        }
    });
});

// For handling error in Admin Login form 
$(function(){
    $('#adminLoginform').on('submit', function(e) {
        if(this.checkValidity() == false) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass("was-validated");
        } 
    }); 
});

