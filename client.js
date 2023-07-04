import net from "net";
import chalk from "chalk";
import readline from "readline";
import setting from "./setting.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const client = net.connect({ port: setting.PORT, host: setting.HOST }, () => {
  client.setEncoding("utf8");

  console.clear();
  process.stdout.write(chalk.blue(`아이디를 입력하세요: `));

  rl.on("line", (line) => {
    if (line === "") return;

    if (!client.name) {
      // if(!login)
      client.write(JSON.stringify({ status: 100, body: `${line}` }));
      return;
    }

    if (line.startsWith("/")) {
      if (line === "/users")
        client.write(JSON.stringify({ status: 210, body: `${line}` }));
      else if (line.startsWith("/w ")) {
        const cmd = line.split(" ");

        const toUser = cmd[1];
        if (toUser === "") return;

        const text = cmd.slice(2).join(" ");
        if (text === "") return;
        client.write(
          JSON.stringify({ status: 220, toID: `${toUser}`, body: `${text}` })
        );
      }
    } else {
      if (line.match(/\S/) === null) return;
      client.write(
        JSON.stringify({ status: 200, fromID: client.name, body: line })
      );
    }
  });

  client.on("data", (data) => {
    let d = JSON.parse(data);

    switch (d.status) {
      case 101: // 로그인 승인
        client.name = d.body;
      case 102: // 로그인 알림
        console.log(chalk.blue(`${d.body}님이 입장했습니다.`));
        break;
      case 110: // 로그인-아이디 중복
      case 111: // 로그인-사용할 수 없는 문자 사용
        console.log(chalk.red(`${d.body}`));
        process.stdout.write(chalk.blue(`아이디를 입력하세요: `));
        break;
      case 150: // 로그아웃
        console.log(chalk.blue(`${d.body}님이 퇴장했습니다.`));
        break;
      case 201: // 채팅 전송
      case 211: // 명령어 전송 승인
        console.log(d.body);
        break;
      case 221: // 귓속말 전송 승인
        console.log(chalk.magenta(d.body));
        break;
      case 222: // 귓속말 전송 거부
        console.log(chalk.red(d.body));
        break;
      case 225: // 서버 귓속말 전송
        let toServer = chalk.bold("From Server");
        console.log(chalk.yellow(`${toServer} : ${d.body}`));
        break;
      case 250: // 공지 전송
        console.log(chalk.yellow.bold(d.body));
        break;
      case 300: // 유저 강퇴
        console.log(chalk.red(d.body));
        process.exit();
        break;
      case 310: // 유저 강퇴 알림
        console.log(chalk.blue(d.body));
        break;
    }
  });

  client.on("error", (err) => {
    // console.log(chalk.red(`서버에 오류가 발생했습니다.`));
    // process.exit();
  });

  client.on("close", () => {
    console.log(chalk.red(`서버와 연결이 끊겼습니다.`));
    process.exit();
  });
});
