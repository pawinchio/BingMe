const showError = (queryText, errorText) => {
    $('label[for='+queryText+']').css('color','red');
    queryText = "#" +queryText;
    $(queryText).css('border-color','red');
    $(queryText)[0].setCustomValidity(errorText);
}

const hideError = (queryText) => {
    $('label[for='+queryText+']').css('color','#00FF89');
    queryText = "#" +queryText;
    $(queryText).css('border-color','#00FF89');
    $(queryText)[0].setCustomValidity('');
}

$('#confirmPassword').on('input', (e)=>{
    if($('#confirmPassword').val() != $('#registerPassword').val()){
        showError('confirmPassword', 'Please re-enter the same password');
    }else {
        hideError('confirmPassword');
    }
});

$('#registerPassword').on('input', ()=>{
    if($('#registerPassword').val().length < 6){
        showError('registerPassword', 'Password should have at least 6 character');
    }else {
        hideError('registerPassword');
    }
});

$('#registerPhone').on('input', ()=>{
    if($('#registerPhone').val().length < 10){
        showError('registerPhone', 'Phone number should have at least 10 character');
    }else {
        hideError('registerPhone');
    }
});
