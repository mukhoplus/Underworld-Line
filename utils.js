import chalk from "chalk";

export default class utils {
  static getCurrentTime() {
    const today = new Date();

    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    month = month >= 10 ? month : "0" + month;
    let day = today.getDate();
    day = day >= 10 ? day : "0" + day;
    let hour = today.getHours();
    hour = hour >= 10 ? hour : "0" + hour;
    let minute = today.getMinutes();
    minute = minute >= 10 ? minute : "0" + minute;
    let second = today.getSeconds();
    second = second >= 10 ? second : "0" + second;

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  static getCurrentUserCount(users) {
    return users.length;
  }

  static getCurrentUserList(users) {
    const result = users.map((user) => user.name);
    return result;
  }

  static getCount(users) {
    const result = chalk.yellow(
      `현재 인원 : ${this.getCurrentUserCount(users)}명`
    );
    return result;
  }

  static commandUsers(users) {
    let result = this.getCount(users);
    if (users.length !== 0)
      result += "\n" + chalk.blue(this.getCurrentUserList(users));
    return result;
  }

  static commandListByServer() {
    const result =
      chalk.magenta("[명령어 목록]\n") +
      chalk.yellow(
        "- 서버/클라이언트 명령어\n  - /users : 현재 인원, 아이디 출력\n  - /w ID TEXT : ID에게 귓속말 전송\n  - /help : 명령어 목록 출력\n"
      ) +
      chalk.yellow(
        "- 서버 명령어\n  - /kick ID : 해당 유저를 추방\n  - /shutdown : 서버를 종료\n"
      ) +
      chalk.yellow(
        "- 클라이언트 명령어\n  - /quit : 프로그램 종료(Control + C)"
      );
    return result;
  }

  static commandListByClient() {
    const result =
      chalk.magenta("[명령어 목록]\n") +
      chalk.yellow(
        "  - /users : 현재 인원, 아이디 출력\n  - /w ID TEXT : ID에게 귓속말 전송\n  - /help : 명령어 목록 출력\n  - /quit : 프로그램 종료(Control + C)"
      );
    return result;
  }
}
