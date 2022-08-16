export default class utils{
    static getCurrentTime(){
        const today = new Date();
    
        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        month = month >= 10 ? month : '0' + month; 
        let day = today.getDate();
        day = day >= 10 ? day : '0' + day;
        let hour = today.getHours();
        hour = hour >= 10 ? hour : '0' + hour;
        let minute = today.getMinutes();
        minute = minute >= 10 ? minute : '0' + minute;
        let second = today.getSeconds();
        second = second >= 10 ? second : '0' + second;
    
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    
    static getCurrentUserCount(users){
        return users.length;
    }
    
    static getCurrentUserList(users){
        let result = [];
        for(let user of users) result.push(user.name);
        return result;
    }
    
    static getUsers(users){
        const result = chalk.yellow(`현재 인원 : ${getCurrentUserCount(users)}명`) + '\n' + chalk.blue(getCurrentUserList(users));
        return result;   
    }
}
