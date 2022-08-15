import net from 'net';
import chalk from 'chalk';
import readline from 'readline';

const PORT = 2022;
const HOST = '127.0.0.1';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let login = false;
let ID = '';
const client = net.connect({port: PORT, host: HOST}, ()=>{
    client.setEncoding('utf8');
    
    console.clear();
    process.stdout.write(chalk.blue(`아이디를 입력하세요: `)); 

    rl.on('line', (line)=>{
        if(line !== ''){
            if(login) client.write(JSON.stringify({status: 200, body: `${ID} : ${line}`}));
            else{
                ID = line;
                client.write(JSON.stringify({status: 100, body: `${line}`}));
            }
        }
    });

    client.on('data', (data)=>{
        let d = JSON.parse(data);

        switch(d.status){
            case 101:
                login = true;
                console.log(chalk.blue(`${d.body}`));
            break;
            case 110:
                console.log(chalk.red(`${d.body}`));
                process.stdout.write(chalk.blue(`아이디를 입력하세요: `));
            break;
            case 150:
                console.log(chalk.blue(`${d.body}님이 퇴장했습니다.`));
            break;
            case 201:
                console.log(chalk.green(d.body));
            break;
        }
    });

    client.on('error', (err)=>{
        console.log(chalk.red(`서버에 오류가 발생했습니다.`));
        process.exit();
    });

    client.on('close', ()=>{
        console.log(chalk.blue(`서버와 연결이 끊겼습니다.`));
        process.exit();
    });
});
