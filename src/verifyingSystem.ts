import { Context, Logger } from "koishi"


interface verifying_users {
    playerID: string
    playerName: string
    code: number
    cancel: () => void
}

export class VerifyingSystem {
    private static verifying_users: verifying_users[] = []

    // 添加验证用户,返回取消函数
    static addVerifyingUser(ctx: Context, playerName: string, timeout: number, log: Logger): {code: number, cancel: () => void} {
        const user = this.verifying_users.find(user => user.playerName === playerName)
        if (user) {
            return {code: user.code, cancel: user.cancel}
        }

        let code: number
        do {
            code = Math.floor(100000 + Math.random() * 900000)
        } while (this.verifying_users.find(user => user.code === code))

        const cancel = ctx.setTimeout(() => {
            log.info(`玩家 ${playerName} 验证超时`)
            this.removeVerifyingUser(playerName)
        }, timeout * 1000)
        this.verifying_users.push({
            playerID: null, playerName, code, cancel
        })

        // 创建取消函数
        const cancelFunc = () => {
            cancel()
            this.removeVerifyingUser(playerName)
        }
        return {code, cancel: cancelFunc}
    }

    // 验证用户,返回玩家ID和玩家名
    static verifyUser(code: number): {playerID: string, playerName: string} | null {
        const playerName = this.checkVerifyingUser(code)
        if (playerName) {
            // 删除验证消息
            this.removeVerifyingUser(playerName.playerName)
            return {playerID: playerName.playerID, playerName: playerName.playerName}
        }
        return null
    }

    // 检查是否有正在验证的用户
    private static checkVerifyingUser(code: number): {playerID: string, playerName: string} | null {
        const user = this.verifying_users.find(user => user.code === code)
        if (user) {
            return user
        }
        return null
    }

    // 删除验证用户
    private static removeVerifyingUser(playerName: string) {
        this.verifying_users = this.verifying_users.filter(user => user.playerName !== playerName)
    }
}
