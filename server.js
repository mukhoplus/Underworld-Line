import net from 'net';
import chalk from 'chalk';
import readline from 'readline';

const PORT = 2022;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getCurrentTime(){
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

function getCurrentUserCount(){
    console.log(chalk.yellow(`현재 인원 : ${users.length}명`));
}

let users = [];

const server = net.createServer((client)=>{
    client.setEncoding('utf8');

    rl.on('line', (line)=>{
        if(line !== ''){
            client.write(JSON.stringify({status: 250, body: `[Notice] ${line}`}));
        }
    });

    client.on('data', (data)=>{
        let d = JSON.parse(data);
        const curTime = getCurrentTime();
        
        switch(d.status){
            case 100:
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
            case 200:
                console.log(chalk.green(`[${curTime}] ${d.body}`));
                for(let user of users){
                    if(client.name === user.name) continue;
                    user.write(JSON.stringify({status: 201, body:`${d.body}`}));
                }
            break;
        }
    });

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
