$(document).ready(function() {

    $('#uploadForm').submit(function() {
       $("#status").empty().text("File is uploading...");
       $(this).ajaxSubmit({

           error: function(xhr) {
       status('Error: ' + xhr.status);
           },

           success: function(response) {
       $("#status").empty().text(response);
               console.log(response);
           }
   });
       //Very important line, it disable the page refresh.
   return false;
   });  
   });


$("#img").on("input",()=>{
    // ajax
    $.post('/upload',document.getElementById('img').value,);

})