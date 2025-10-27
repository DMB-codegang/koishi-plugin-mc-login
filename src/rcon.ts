import { Context } from 'koishi'
import { Rcon } from 'rcon-client';

export interface ServerConfig {
  rconHost: string;
  rconPort: number;
  rconPassword: string;
  playerListUpdateInterval: number;
}

export class rcon {
    playerList: string[] = []

    ctx: Context
    config: ServerConfig

    rcon: Rcon
    closeInteral: () => void

    // 玩家列表变动事件
    private playerListChangeCallbacks: ((oldPlayers: string[], newPlayers: string[]) => void)[] = []
    constructor(ctx: Context, config: ServerConfig) {
        this.ctx = ctx
        this.config = config
        this.closeInteral = ctx.setInterval(this.updatePlayerList.bind(this), config.playerListUpdateInterval)
        this.rcon = new Rcon({
            host: config.rconHost,
            port: config.rconPort,
            password: config.rconPassword,
        })
        this.rcon.connect()
    }

    close() {
        this.rcon.end()
        this.closeInteral()
    }

    private async updatePlayerList() {
        try {
            if (!this.rcon.socket) {
                await this.rcon.connect()
            }
            const playerList = await this.rcon.send('list')
            
            if (playerList.indexOf('players online: ') === -1) {
                return
            }
            let newPlayerList = (playerList.substring(playerList.indexOf('players online: ')+16)).split(', ')
            
            // 过滤掉名称中包含空格的非正常玩家
            newPlayerList = newPlayerList.filter(player => !player.includes(' '))
            // 修复：当服务器没有玩家时，过滤掉空字符串
            newPlayerList = newPlayerList.filter(player => player.trim() !== '')
            
            // 检测玩家列表是否发生变化
            const oldPlayerList = [...this.playerList]
            this.playerList = newPlayerList
            
            // 如果玩家列表发生变化，触发事件
            if (JSON.stringify(oldPlayerList) !== JSON.stringify(newPlayerList)) {
                this.triggerPlayerListChange(oldPlayerList, newPlayerList)
            }
            
        } catch (error) {
            console.error('Failed to update player list:', error)
        }
    }

    // 注册玩家列表变动事件监听器
    onPlayerListChange(callback: (oldPlayers: string[], newPlayers: string[]) => void) {
        this.playerListChangeCallbacks.push(callback)
    }

    // 触发玩家列表变动事件
    private triggerPlayerListChange(oldPlayers: string[], newPlayers: string[]) {
        this.playerListChangeCallbacks.forEach(callback => {
            try {
                callback(oldPlayers, newPlayers)
            } catch (error) {
                console.error('Error in player list change callback:', error)
            }
        })
    }

    

    async kickPlayer(playerName: string, message: string) {
        try {
            if (!this.rcon.socket) {
                await this.rcon.connect()
            }
            await this.rcon.send('kick '+ playerName + ' ' + message)
        } catch (error) {
            console.error('Failed to kick player:', error)
        }
    }

    async resetPassword(playerName: string, password: string) {
        try {
            if (!this.rcon.socket) {
                await this.rcon.connect()
            }
            await this.rcon.send('auth update '+ playerName + ' ' + password)
        } catch (error) {
            console.error('Failed to reset password:', error)
        }
    }
}