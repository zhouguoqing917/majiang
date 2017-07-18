module.exports={
    load:()=>{
        require('./autonumber').load();
        require('./gameuser').load();
        require('./room').load();
        require('./roomcardrecord').load();
        require('./gameResult').load();
        require('./gameRecord').load();
        require('./record').load();
        require('./shareRecord').load();
        require('./gameMessages').load();
        require('./gameAnnouncements').load();
    }
}

