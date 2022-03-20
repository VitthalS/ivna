console.log('test')
$(document).ready(function(){

	$("#form").submit(function(e){
        e.preventDefault();
    });
	// https://github.com/VitthalS/ivna
 	$("#submit").on('click', function(){
 		var a = $('#form').serializeArray();
 		var post_data = {};
 		$.each(a, function () {
 			if (post_data[this.name]) {
                if (!post_data[this.name].push) {
                    post_data[this.name] = [post_data[this.name]];
                }
                post_data[this.name].push(this.value || '');
            } else {
                post_data[this.name] = this.value || '';
            }
        });
        alert(JSON.stringify(post_data));
    	$.ajax({
     		type: "POST",
 			url: "/dashboard",
 			dataType: 'json',
            contentType: 'application/json',
 			data: JSON.stringify(post_data),
         	success: function(msg){
            	$('#response').html(msg.msg);
         	},
 			error: function(){
 				alert("failure");
 			}
       	});
 	});
});