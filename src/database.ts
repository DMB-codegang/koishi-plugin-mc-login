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

    async register(playerID: string, playerName: string): Promise<'success' | 'failed'> {
        try {
            await this.ctx.database.create('mcl', { playerID, playerName: playerName, lastLoginTime: new Date() })
            return 'success'
        } catch (error) {
            return 'failed'
        }
    }

    async getPlayerID(playerName: string): Promise<string | null> {
        const player = await this.ctx.database.get('mcl', { playerName })
        if (player.length > 0) {
            return player[0].playerID
        }
        return null
    }

    private async updateLoginTime(playerID: string) {
        await this.ctx.database.set('mcl', { playerID: playerID }, { lastLoginTime: new Date() })
    }
}