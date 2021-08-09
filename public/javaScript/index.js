// For background image of heading 
$(window).on("resize", Img);
$(document).ready(Img);

function Img() {
  var width = window.innerWidth; // No need for jQuery here, raw JS can do this
  if (width > 992) {
    $(".home-image").attr("src", "images/home-bg/home-lg.png");
  } else if(width > 768) {
    $(".home-image").attr("src", "images/home-bg/home-md.png");
  } else if(width > 576) {
       $(".home-image").attr("src", "images/home-bg/home-sm.png");
  } else {
      $(".home-image").attr("src", "images/home-bg/home-xs.png");
  }
}

// For Carousel-Slider
jQuery(document).ready(function () {
  new WOW().init();

  $("#carousel-example").on("slide.bs.carousel", function (e) {
    var $e = $(e.relatedTarget);
    var idx = $e.index();
    var itemsPerSlide = 5;
    var totalItems = $(".carousel-item").length;

    if (idx >= totalItems - (itemsPerSlide - 1)) {
      var it = itemsPerSlide - (totalItems - idx);
      for (var i = 0; i < it; i++) {
        // append slides to end
        if (e.direction == "left") {
          $(".carousel-item").eq(i).appendTo(".carousel-inner");
        } else {
          $(".carousel-item").eq(0).appendTo(".carousel-inner");
        }
      }
    }
  });
});


// Example starter JavaScript for disabling form submissions if there are invalid fields
//for signup form
// (function () {
//   "use strict";
//   window.addEventListener(
//     "click",
//     function () {
//       // Fetch all the forms we want to apply custom Bootstrap validation styles to
//       var signUpForms = document.getElementsByClassName(
//         "signup-needs-validation"
//       );
    
//       // Loop over them and prevent submission
//       var signUpValidation = Array.prototype.filter.call(
//         signUpForms,
//         function (form) {
//           form.addEventListener(
//             "submit",
//             function (event) {
//               if (form.checkValidity() === false) {
//                 event.preventDefault();
//                 event.stopPropagation();
//               }
//               form.classList.add("was-validated");
//             },
//             false
//           );
//         }
//       );
//     },
//     false
//   );
// })();

//for login form
// (function () {
//   "use strict";
//   window.addEventListener(
//     "click",
//     function () {
//       // Fetch all the forms we want to apply custom Bootstrap validation styles to
//       var loginForms = document.getElementsByClassName(
//         "login-needs-validation"
//       );
//       // Loop over them and prevent submission
//       var loginValidation = Array.prototype.filter.call(
//         loginForms,
//         function (form) {
//           form.addEventListener(
//             "submit",
//             function (event) {
//               if (form.checkValidity() === false) {
//                 event.preventDefault();
//                 event.stopPropagation();
//               }
//               form.classList.add("was-validated");
//             },
//             false
//           );
//         }
//       );
//     },
//     false
//   );
// })();



// sign up form show password
const passWord = document.querySelector(".showPassword");
passWord.onclick = myPassword;

function myPassword() {
  const x = document.querySelector(".Password");
  const icon = document.querySelector(".passwordIcon");
  if (x.type === "password") {
    x.type = "text";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  } else {
    x.type = "password";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  }
}
// sign up form show confirm password
const confirmPassword = document.querySelector(".showConfirmPassword");
confirmPassword.onclick = myConfirmPassword;

function myConfirmPassword() {
  const x = document.querySelector(".confirm-password");
  const icon = document.querySelector(".confirmPasswordIcon");
  if (x.type === "password") {
    x.type = "text";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  } else {
    x.type = "password";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  }
} 

//login form show password
const loginPassword = document.querySelector(".showLoginPassword");
loginPassword.onclick = myLoginPassword;

function myLoginPassword() {
  const x = document.querySelector(".login-password");
  const icon = document.querySelector(".loginPasswordIcon");
  if (x.type === "password") {
    x.type = "text";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  } else {
    x.type = "password";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  }
}

// To check equality of password and confirm password
$("#password, #confirm-password").on("keyup", function () {
  if ($("#password").val() != $("#confirm-password").val()) {
    $("#password-same").removeClass("d-none");
    $(".signUpDisabled").attr("disabled", true);
  } else {
    $("#password-same").addClass("d-none");
    $(".signUpDisabled").removeAttr("disabled");
  }
});

 
// For handling invalid login credentials and disabling form submissions if there are invalid fields
$(function(){
    $('#loginform').on('submit', function(e) {
        if(this.checkValidity() == false) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass("was-validated");
        } else {
            e.preventDefault();
            const data =  $(this).serialize();
            $.post('/login', data, function(result) {
                if(result === false)
                {
                    const alert = '<div class="alert alert-danger alert-dismissible fade show" role="alert">Incorrect username or password. <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button> </div>';

                    $("#loginAlert").html(alert);
                }
                else
                {
                    window.location.href = "/menu";
                }
            });   
        }
    });
});
 
// For handling error when given email id is already registered and disabling form submissions if there are invalid fields
 $(function(){
    $('#signupform').on('submit', function(e) {
        if(this.checkValidity() == false) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass("was-validated");
        } else {
            e.preventDefault();
            const data =  $(this).serialize();
            $.post('/signup', data, function(result) {
                if(result === false)
                {
                    const alert = '<div class="alert alert-danger alert-dismissible fade show" role="alert"> Email is already registered. <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button> </div>';

                    $("#signupAlert").html(alert);
                }
                else
                {
                    window.location.href = "/menu";
                }
            });
        }
    });
});

