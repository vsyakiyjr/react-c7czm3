$(function() {
	if ($(window).width() > 736) {
		$('#fullpage').fullpage({
			anchors: ['page1', 'page2', 'page3', 'page4', 'page5', 'page6'],
			scrollingSpeed: 500,
			navigation: true,
			navigationPosition: 'right',
			'css3': true,
			onLeave: function(index, newIndex, direction){
				if (index == 1 && direction == 'down') {
					$('.logo a, .rules a, .menu a').addClass('active-1');
				}
				else if (index == 2 && direction == 'up') {
					$('.logo a, .rules a, .menu a').removeClass('active-1');
				}
				
				if (index == 1 && direction == 'down') {
					$('.phone-1').removeClass('moveDown').addClass('moveUp');
				}
				else if (index == 2 && direction == 'up') {
					$('.phone-1').removeClass('moveUp').addClass('moveDown');
				}
				
				if (index == 1 && direction == 'down') {
					$('.phone-1').removeClass('moveDown').addClass('moveUp');
				}
				else if (index == 2 && direction == 'up') {
					$('.phone-1').removeClass('moveUp').addClass('moveDown');
				}
				
				if (index == 3 && direction == 'down') {
					$('.logo a, .rules a, .menu a').addClass('active-2');
					$('.logo a, .rules a, .menu a').removeClass('active-1');
				}
				else if (index == 4 && direction == 'up') {
					$('.logo a, .rules a, .menu a').addClass('active-1');
					$('.logo a, .rules a, .menu a').removeClass('active-2');
				}
				else if (index == 5 && direction == 'up') {
					$('.logo a, .rules a, .menu a').addClass('active-2');
					$('.logo a, .rules a, .menu a').removeClass('active-1');
				}
				
				if (index == 4 && direction == 'down') {
					$('.logo a, .rules a, .menu a').addClass('active-1');
					$('.logo a, .rules a, .menu a').removeClass('active-2');
				}
				if (index == 6 && direction == 'up') {
					$('.logo a, .rules a, .menu a').addClass('active-1');
					$('.logo a, .rules a, .menu a').removeClass('active-2');
				}
				
				if (index == 5 && direction == 'down') {
					$('footer').fadeIn();
				}
				else if (index == 6 && direction == 'up') {
					$('footer').fadeOut();
				}
			},
			afterLoad: function(anchorLink, index){
				if (index == 2){
					$('.img-1, .img-2').addClass('active');
				}
				else if (index == 3){
					$('.img-3, .img-4').addClass('active');
				}
			},
		});
		$("#fp-nav li:nth-child(1) a").click(function() {
			$('.logo a, .rules a, .menu a').removeClass("active-2");
			$('.logo a, .rules a, .menu a').removeClass("active-1");
			$('.phone-1').removeClass('moveUp').addClass('moveDown');
		});
		$("#fp-nav li:nth-child(7) a").click(function() {
			$('footer').fadeIn();
		});
		$("#fp-nav li:nth-child(5) a").click(function() {
			$('.logo a, .rules a, .menu a').addClass("active-2");
			$('.logo a, .rules a, .menu a').removeClass("active-1");
		});
		$('#new-fullpage').fullpage({
			scrollingSpeed: 500,
			navigation: true,
			navigationPosition: 'right',
			'css3': true,
			onLeave: function(index, newIndex, direction){
				if (index == 5 && direction == 'down') {
					$('footer').fadeIn();
				}
				else if (index == 6 && direction == 'up') {
					$('footer').fadeOut();
				}
			}
		});
	} else {
		$(".block-1 .col-md-8").append("<div class='start'></div>");
		$(".block-1 h3, .block-1 span").appendTo(".start");
		$(".block-1 p").find("br:nth-child(2)").after("<br/>");
		
		$(".block-2").after("<div class='block block-2 section'><div class='container'><div class='slick-slider'><div class='slide-1'></div><div class='slide-2'></div><div class='slide-3'></div><div class='slide-4'></div></div></div></div>");
		for (var i = 0; i < 5; i++) {
			$(".img-"+ i).appendTo(".slide-"+ i);
		}
		
		$(".slick-slider").slick({
			dots: true,
			infinite: true,
			slidesToShow: 3,
			slidesToScroll: 1,
			responsive: [
				{
					breakpoint: 568,
					settings: {
						slidesToShow: 1
					}
				}
			]
		});
		$(".block-4 .row").slick({
			dots: true,
			infinite: true
		});
	}
});

$(document).on('click', '#moveTo', function() {
	setTimeout(function() {
		$("#useremail").focus();
	}, 500);
});

/*FORM*/
$(function() {
    $("button").click(function () {
        if ($("#useremail").is(":valid")) {
            $("#useremail").removeClass("invalid");
            $("#form p").remove();
            var subject = $('input[name="subject"]').val();
            var email = $('input[name="email"]').val();
            $.post("/scripts/mail.php", { 'email' : email, 'subject' : subject }, function(data) {
                $(".success").fadeIn();
            });
        } else {
            $("#useremail").addClass("invalid");
            $("#form").append("<p class='error'>Вы указали не верный email</p>")
        }
    });
});
$(".success").click(function() {
    $(this) .fadeOut();
    $('input[name="email"]').val("");
});
$(document).ready(function(){
	$.ajax({
		url: 'https://api.instagram.com/v1/users/self/',
		dataType: 'jsonp',
		type: 'GET',
		data: {access_token: '6243525421.683b9f0.5f3fe4a6b990483f87c1b7e3a4bfc2e0'},
		success: function(response){
 			$('#insta_count h5').append(response.data.counts.followed_by);
		}
	});
});