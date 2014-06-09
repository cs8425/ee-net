var render = function (data){
	var template = $("#linkList").html();
//console.log(_.template(template,{data:data}));
	$("#list").html(_.template(template,{data:data}));
	$('[data-toggle=offcanvas]').click(function () {
		$('.row-offcanvas').toggleClass('active')
	});
};
var bind = function (){
	$('a').each(function( key, ele ) {
		console.log( key + ": " + ele );
		var e = $(ele);
		if(e.attr('href')){
			if(e.attr('href')[0] != '/'){
				e.attr('target', '_blank');
			}
		}
	});
};

$.ajax({
	url: "/api/root",
	type: "GET",
	dataType: "json",
	success: function( data, textStatus, jqXHR ) {
		console.log(data);
		render(data);
		bind();
	},
	error: function( data, textStatus, jqXHR ) {
		console.log('error', data, textStatus, jqXHR);
	}
});
$('[data-toggle=offcanvas]').click(function () {
	$('.row-offcanvas').toggleClass('active')
});



