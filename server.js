import net from 'net';
import chalk from 'chalk';
const PORT = 2022;

function getCurrentTime(){
    const today = new Date();   
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    month = month >= 10 ? month : '0' + month; 
    let day = today.getDate();
    day = day >= 10 ? day : '0' + day;
    let hour = today.getHours();
    hour = hour >= 10 ? hour : '0' + hour
    let minute = today.getMinutes();
    minute = minute >= 10 ? minute : '0' + minute;
    let second = today.getSeconds();
    second = second >= 10 ? second : '0' + second;

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function getCurrentUserCount(){
    console.log(chalk.yellow(`현재 인원 : ${users.length}명`));
}

let users = [];

const server = net.createServer((client)=>{
    client.setEncoding('utf8');

    // 데이터 수신
    client.on('data', (data)=>{
        let d = JSON.parse(data);
        const curTime = getCurrentTime();
        
        switch(d.status){
            case 100: // 클라이언트 접속
                // 중복 체크
                let dup = false;
                for(let user of users){
                    if(user.name === d.body){
                        dup = true;
                        break;
                    }
                }
                
                if(dup) client.write(JSON.stringify({status: 110, body:'중복된 아이디입니다. 다시 시도하세요.'}));
                else{
                    client.name = d.body;
                    users.push(client);
                    getCurrentUserCount();
                    console.log(chalk.blue(`[${curTime}] ${d.body}님이 접속했어요.(IP 주소 : ${client.localAddress})`));
                    for(let user of users) user.write(JSON.stringify({status: 101, body:`${d.body}님이 들어왔습니다.`}));
                }
            break;
            case 200: // 채팅 전송
                console.log(chalk.green(`[${curTime}] ${d.body}`));
                for(let user of users){
                    if(client.name === user.name) continue; // 본인에게는 전송하지 않음
                    user.write(JSON.stringify({status: 201, body:`${d.body}`})); // 모든 유저에게 전송
                }
            break;
        }
    });

    // 접속 종료
    client.on('close', ()=>{
        if(client.name !== undefined){
            const index = users.indexOf(client);
            users.splice(index, 1);
            
            getCurrentUserCount()
            console.log(chalk.blue(`[${getCurrentTime()}] ${client.name}님이 퇴장했어요.`));
            for(let user of users) user.write(JSON.stringify({status: 150, body:`${client.name}`}));
        }
    });
});

// 포트 수신 시작
server.listen(PORT, '0.0.0.0', ()=>{
    console.clear();
    console.log(chalk.blue(`[${getCurrentTime()}] Port ${PORT}에서 서버가 열렸습니다.\n`));

    server.on('error', (err)=>{
        console.log(chalk.red(`[${getCurrentTime()}] 서버에 오류가 발생했습니다.`));
    });

    server.on('close', ()=>{
        console.log(chalk.blue(`[${getCurrentTime()}] 서버를 닫습니다.`));
    });
});
