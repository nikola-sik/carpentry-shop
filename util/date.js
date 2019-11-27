module.exports.currentDate = () => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    
    
    today =   yyyy+ '-' + mm + '-' + dd;
    return today;
}

module.exports.minDate = () => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); 


    let dd = minDate.getDate();
    let mm = minDate.getMonth()+1; //January is 0!
    let yyyy = minDate.getFullYear();
     if(dd<10){
            dd='0'+dd
        } 
        if(mm<10){
            mm='0'+mm
        } 
    
        minDate =   yyyy+'-'+mm+'-'+dd;
    return minDate;
}

module.exports.currentDateTime = () => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let hh = today.getHours();
    let MM = today.getMinutes();
    let ss = today.getSeconds();
    
    today =   yyyy+ '-' + mm + '-' + dd + ' ' + hh + ':' + MM + ':' + ss ;
    
    return today;
}

module.exports.dateLastYear = () => {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear() - 1;
  
    
    today =   yyyy+ '-' + mm + '-' + dd;
    return today;
}