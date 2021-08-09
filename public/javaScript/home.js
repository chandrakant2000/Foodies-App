
/* ////////////////////////////////////////////////   HEADER SECTION   ///////////////////////////////////////////// */

if (window.innerWidth >= 768 && window.innerWidth < 940) {
  $(".nav-item").removeClass("mx-3");
  $(".nav-link").removeClass("px-3");
  $(".nav-item").addClass("mx-1");
  $(".nav-link").addClass("px-2");
} else {
  $(".nav-item").removeClass("mx-1");
  $(".nav-link").removeClass("px-2");
  $(".nav-item").addClass("mx-3");
  $(".nav-link").addClass("px-3");
}

$(window).resize(function () {
  var viewport = window.innerWidth;
  if (viewport >= 768 && viewport < 940) {
    $(".nav-item").addClass("mx-1");
    $(".nav-link").addClass("px-2");
    $(".nav-item").removeClass("mx-3");
    $(".nav-link").removeClass("px-3");
  } else {
    $(".nav-item").removeClass("mx-1");
    $(".nav-link").removeClass("px-2");
    $(".nav-item").addClass("mx-3");
    $(".nav-link").addClass("px-3");
  }
});

// Resizing cart content section
$(window).resize(function () {
  var viewport = window.innerWidth;
    if(viewport <= 992){
        $('.cart').removeClass('container').addClass('container-fluid');
    } else {
        $('.cart').removeClass('container-fluid').addClass('container');
    }
});


