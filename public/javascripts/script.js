function addTocart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
            let count=$('#ShowCount').html()
            count=parseInt(count)+1
            $('#ShowCount').html(count)
        }
        }
    })
}