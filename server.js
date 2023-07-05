import net from "net";
import chalk from "chalk";
import readline from "readline";
import utils from "./utils.js";
import setting from "./setting.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let users = [];

const server = net.createServer((client) => {
  client.setEncoding("utf8");

  client.on("data", (data) => {
    try {
      let d = JSON.parse(data);
      const curTime = utils.getCurrentTime();
      const curUsers = utils.getCurrentUserList(users);

      switch (d.status) {
        case 100: // 로그인 요청
          if (curUsers.includes(d.body)) {
            client.write(
              JSON.stringify({
                status: 110,
                body: "중복된 아이디입니다. 다시 시도하세요.",
              })
            );
            return;
          }

          if (/[\s|\/]/.test(d.body)) {
            client.write(
              JSON.stringify({
                status: 111,
                body: "사용할 수 없는 아이디입니다. 다시 시도하세요.",
              })
            );
            return;
          }

          client.name = d.body;
          users.push(client);
          console.log(utils.getCount(users));
          console.log(
            chalk.blue(
              `[${curTime}] ${client.name}님이 입장했어요.(IP 주소 : ${client.remoteAddress})`
            )
          );
          for (let user of users) {
            if (user.name === client.name) {
              user.write(
                JSON.stringify({ status: 101, body: `${client.name}` })
              );
              continue;
            }
            user.write(JSON.stringify({ status: 102, body: `${client.name}` }));
          }
          break;
        case 200: // 채팅 전송 요청
          console.log(chalk.green(`[${curTime}] ${d.fromID} : ${d.body}`));
          for (let user of users) {
            let id =
              client.name === user.name
                ? chalk.cyan(d.fromID)
                : chalk.hex("#FF8800")(d.fromID);
            let text = chalk.green(d.body);
            user.write(
              JSON.stringify({
                status: 201,
                body: `${chalk.bold(id)} : ${text}`,
              })
            );
          }
          break;
        case 210: // 명령어 전송 요청
          const result = utils.commandUsers(users);
          client.write(JSON.stringify({ status: 211, body: `${result}` }));
          break;
        case 220: // 귓속말 전송 요청
          const index = curUsers.indexOf(d.toID);
          if (index === -1) {
            client.write(
              JSON.stringify({ status: 222, body: "전송할 ID가 없습니다." })
            );
            return;
          }

          // 해당 유저가 있으면 dm 전송
          const selectedUser = users[index];
          if (client.name === selectedUser.name) {
            // 단, 본인에게는 전송하지 못함.
            selectedUser.write(
              JSON.stringify({
                status: 222,
                body: "본인에게는 DM을 보낼 수 없습니다.",
              })
            );
            return;
          }

          selectedUser.write(
            JSON.stringify({
              status: 221,
              body: `DM) ${client.name} : ${d.body}`,
            })
          );
          console.log(
            chalk.magenta(
              `[${curTime}] ${client.name} 유저가 ${selectedUser.name} 유저에게 DM을 보냈어요 -> ${d.body}`
            )
          );
          client.write(
            JSON.stringify({ status: 221, body: "DM 전송에 성공했습니다." })
          );
          break;
      }
    } catch (error) {
      console.log(chalk.red(`[${curTime}] 의문의 에러\n${error}`));
    } finally {
      if (client.name === undefined) return;
      const index = users.indexOf(client);
      users.splice(index, 1);
    }
  });

  client.on("close", () => {
    if (client.name === undefined) return;

    const curTime = utils.getCurrentTime();
    const index = users.indexOf(client);
    users.splice(index, 1);

    console.log(utils.getCount(users));
    if (client.kick) {
      // 강퇴
      console.log(chalk.blue(`[${curTime}] ${client.name}님을 강퇴했어요.`));
      return;
    }
    // 일반적인 종료 상황
    console.log(chalk.blue(`[${curTime}] ${client.name}님이 퇴장했어요.`));
    for (let user of users)
      user.write(JSON.stringify({ status: 150, body: `${client.name}` }));
  });

  client.on("error", (err) => {});
});

server.listen(setting.PORT, "0.0.0.0", () => {
  console.clear();
  console.log(
    chalk.blue(
      `[${utils.getCurrentTime(users)}] Port ${
        setting.PORT
      }에서 서버가 열렸습니다.\n`
    )
  );

  rl.on("line", (line) => {
    if (line === "") return;

    if (line.startsWith("/")) {
      if (line === "/users") {
        console.log(utils.commandUsers(users));
      } else if (line === "/shutdown") {
        console.log(chalk.blue(`[${utils.getCurrentTime()}] 서버를 닫습니다.`));
        process.exit();
      } else if (line.startsWith("/w ")) {
        const cmd = line.split(" ");

        const toUser = cmd[1];
        if (toUser === "") return;

        const text = cmd.slice(2).join(" ");
        if (text === "") return;

        const curUsers = utils.getCurrentUserList(users);
        const index = curUsers.indexOf(toUser);
        if (index === -1) {
          console.log(chalk.red("해당 유저가 없어요."));
          return;
        }

        const selectedUser = users[index];
        selectedUser.write(JSON.stringify({ status: 225, body: `${text}` }));
        console.log(chalk.magenta("DM 전송에 성공했어요."));
      } else if (line.startsWith("/kick ")) {
        const cmd = line.split(" ");

        const kickUser = cmd[1];
        if (kickUser === "") return;

        const curUsers = utils.getCurrentUserList(users);
        if (curUsers.indexOf(kickUser) === -1) {
          console.log(chalk.red("해당 유저가 없어요."));
          return;
        }

        for (let user of users) {
          let status, text;
          // user.kick : kick을 하게 되면 client에서 process.exit()을 하게 되는데, 이때 server에서 close 이벤트를 발생시킴.
          // 삭제를 2번(해당 함수 + close 이벤트) 하게 되면 삭제 동작이 2번 실행되면서 의도치 않은 동작을 하기 때문에 해당 이벤트의 중복 실행을 막기 위함.
          user.name === kickUser
            ? ((user.kick = true),
              (status = 300),
              (text = "당신은 강퇴당했습니다."))
            : ((status = 310), (text = `${kickUser}님이 강퇴당했습니다.`));
          user.write(JSON.stringify({ status: status, body: `${text}` }));
        }
      }
    } else
      for (let user of users)
        user.write(JSON.stringify({ status: 250, body: `[Notice] ${line}` }));
  });

  server.on("error", (err) => {
    console.log(
      chalk.red(`[${utils.getCurrentTime()}] 서버에 오류가 발생했어요.`)
    );
  });

  server.on("close", () => {
    console.log(chalk.blue(`[${utils.getCurrentTime()}] 서버를 닫습니다.`));
  });
});
