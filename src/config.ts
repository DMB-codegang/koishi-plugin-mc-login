
import { Schema } from 'koishi'


export interface Config {
    // guildId: string
    rconHost: string
    rconPort: number
    rconPassword: string

    playerListUpdateInterval: number
    verifyTimeout: number
}

export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
        // guildId: Schema.string().description('绑定群聊id').default(''),
        rconHost: Schema.string().description('rcon主机地址').default('localhost'),
        rconPort: Schema.number().description('rcon端口号').default(25575),
        rconPassword: Schema.string().role('secret').description('rcon密码').default(''),
        playerListUpdateInterval: Schema.number().description('玩家列表更新间隔（毫秒）').default(1000),
        verifyTimeout: Schema.number().description('验证超时时间（秒）').default(360),
    }),
])