module.exports={
    load:()=>{
        require('./autonumber').load();
        require('./gameuser').load();
        require('./room').load();
        require('./roomcardrecord').load();
    }
}
