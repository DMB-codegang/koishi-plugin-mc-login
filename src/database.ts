import { Context } from 'koishi'

export class database {
    constructor(private ctx: Context) {
        this.ctx = ctx
        ctx.model.extend('mcl', {
            playerName: 'string', // 玩家在mc中的用户名
            lastLoginTime: 'timestamp',
            playerID: 'string',// 玩家绑定的平台id
        }, { autoInc: true, primary: ['playerName'] })
    }

    // 玩家登录
    async login(playerID: string): Promise<'success' | 'unregistered' | 'failed'> {
        // 检查playerID是否存在
        try {
            const player = await this.getPlayerID(playerID)
            if (player === null) {
                return 'unregistered'
            }
            // 更新登录时间
            await this.updateLoginTime(playerID)
            return 'success'
        } catch (error) {
            return 'failed'
        }
    }

    // 玩家注册
    async register(playerID: string, playerName: string): Promise<'success' | 'failed'> {
        try {
            await this.ctx.database.create('mcl', { playerID, playerName: playerName, lastLoginTime: new Date() })
            return 'success'
        } catch (error) {
            return 'failed'
        }
    }

    // 玩家解绑
    async unbind(playerName: string): Promise<'success' | 'failed'> {
        try {
            await this.ctx.database.remove('mcl', { playerName })
            return 'success'
        } catch (error) {
            return 'failed'
        }
    }

    // 获取玩家ID绑定的玩家名列表
    async getPlayerName(playerID: string): Promise<string[]> {
        const player = await this.ctx.database.get('mcl', { playerID })
        return player.map((item) => item.playerName)
    }

    // 获取玩家名绑定的玩家ID
    async getPlayerID(playerName: string): Promise<string | null> {
        const player = await this.ctx.database.get('mcl', { playerName })
        if (player.length > 0) {
            return player[0].playerID
        }
        return null
    }

    // 更新玩家登录时间
    private async updateLoginTime(playerID: string) {
        await this.ctx.database.set('mcl', { playerID: playerID }, { lastLoginTime: new Date() })
    }
}