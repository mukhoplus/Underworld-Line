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
    return users.length;
}

function getCurrentUserList(){
    let result = [];
    for(let user of users) result.push(user.name);
    return result;
}

function getUsers(){
    const result = chalk.yellow(`현재 인원 : ${getCurrentUserCount()}명`) + '\n' + chalk.blue(getCurrentUserList());
    return result;   
}

let users = [];

const server = net.createServer((client)=>{
    client.setEncoding('utf8');

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
                else if(String(d.body).startsWith('/') || String(d.body).includes(' ')) client.write(JSON.stringify({status: 111, body:'사용할 수 없는 아이디입니다. 다시 시도하세요.'}));
                else{
                    client.name = d.body;
                    users.push(client);
                    console.log(chalk.yellow(`현재 인원 : ${getCurrentUserCount()}명`));
                    console.log(chalk.blue(`[${curTime}] ${d.body}님이 접속했어요.(IP 주소 : ${client.remoteAddress})`));
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
            case 210:
                const result = getUsers();
                client.write(JSON.stringify({status: 211, body:`${result}`}));
            break;
            case 220:
                let check = false;

                for(let user of users){
                    if(user.name === d.to){ // 해당 유저가 있으면 dm 전송
                        check = true;
                        if(client.name === user.name){ // 단, 본인에게는 전송하지 못함.
                            user.write(JSON.stringify({status: 222, body:'본인에게는 DM을 보낼 수 없습니다.'}));
                            break;
                        }
                        
                        user.write(JSON.stringify({status: 221, body:`DM) ${client.name} : ${d.body}`})); // 메세지 전송
                        console.log(chalk.magenta(`[${curTime}] ${client.name} 유저가 ${user.name} 유저에게 DM을 보냈어요 -> ${d.body}`));
                        client.write(JSON.stringify({status: 221, body:'DM 전송에 성공했습니다.'})); // 성공 알림
                        break;
                    }
                }
                if(!check) client.write(JSON.stringify({status: 222, body:'전송할 ID가 없습니다.'})); // 실패 알림
            break;
        }
    });

    client.on('close', ()=>{
        if(client.name !== undefined){
            const curTime = getCurrentTime();
            const index = users.indexOf(client);
            users.splice(index, 1);
            
            console.log(chalk.yellow(`현재 인원 : ${getCurrentUserCount()}명`));
            console.log(chalk.blue(`[${curTime}] ${client.name}님이 퇴장했어요.`));
            for(let user of users) user.write(JSON.stringify({status: 150, body:`${client.name}`}));
        }
    });
});

server.listen(PORT, '0.0.0.0', ()=>{
    console.clear();
    console.log(chalk.blue(`[${getCurrentTime()}] Port ${PORT}에서 서버가 열렸습니다.\n`));

    rl.on('line', (line)=>{
        if(line !== ''){
            if(line.startsWith('/')){
                if(line === '/users'){
                    console.log(chalk.yellow(`현재 인원 : ${getCurrentUserCount()}명`));
                    if(users.length !== 0) console.log(chalk.blue(getCurrentUserList()));
                }
                else if(line.startsWith('/w ')){
                    const cmd = line.split(' ');
                    const toUser = cmd[1];

                    if(toUser !== ''){
                        let check = false;

                        for(let user of users){
                            if(user.name === toUser){
                                check = true;
                                try{
                                    const tempText = cmd.slice(2);
                                    if(tempText.length === 0 || (tempText.length === 1 && tempText[0] === '')) throw '';
                                    
                                    let text = '';
                                    for(let i=0; i<tempText.length; i++){
                                        text += tempText[i];
                                        if(i !== tempText.length-1) text += ' ';
                                    }
                                    user.write(JSON.stringify({status: 225, body: `${text}`}));
                                }catch(e){
                                    
                                }
                                break;
                            }
                        }
                        if(!check) console.log(chalk.red('해당 유저가 없습니다.'));
                    }
                }
            }
            else for(let user of users) user.write(JSON.stringify({status: 250, body: `[Notice] ${line}`}));
        }
    });

    server.on('error', (err)=>{
        console.log(chalk.red(`[${getCurrentTime()}] 서버에 오류가 발생했습니다.`));
    });

    server.on('close', ()=>{
        console.log(chalk.blue(`[${getCurrentTime()}] 서버를 닫습니다.`));
    });
});
