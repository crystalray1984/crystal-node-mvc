import Koa from 'koa'
import Redis from 'crystal-node-redis'
import Mysql from 'crystal-node-mysql'
import { Server } from 'http'

interface Pools {
    redis?: Redis.Pool
    mysql?: Mysql.Pool
}

interface Paths {
    readonly root: string
    readonly src: string
    readonly config: string
    readonly init: string
    readonly db: string
    readonly middlewares: string
    readonly controllers: string
    readonly public: string
    readonly [x: string]: string
}

declare namespace MVC {
    class Application<StateT = any, CustomT = {}> extends Koa<StateT, CustomT> {
        /**
         * 初始化应用程序实例
         * @param root 应用程序根目录
         */
        constructor(root: string)

        /**
         * 数据库连接池对象
         */
        readonly db: Pools

        /**
         * 路径定义对象
         */
        readonly paths: Paths

        /**
         * 创建数据库连接
         * @param type 数据库类型
         * @param options 连接配置对象
         */
        connectDb(type: 'mysql', options?: Mysql.ConnectionConfig): Mysql.Client
        connectDb(type: 'redis', options?: Redis.ClientOptions): Redis.Client
        connectDb(type: string, ...options: any[]): any
    }

    class Processor<CustomT = {}> {
        constructor(app: Application<any, CustomT>)

        protected app: Application<any, CustomT>
    }

    class Controller<CustomT = {}> extends Processor<CustomT> {
        ctx: Koa.ParameterizedContext<any, CustomT>

        constructor(app: Application<any, CustomT>, ctx: Koa.ParameterizedContext<any, CustomT>)

        protected __before(action: string, params: string[]): Promise<boolean>
        protected __after(action: string, params: string[]): Promise<void>
        protected __unknown(action: string, params: string[]): Promise<any>
    }

    function run(root: string, port?: number): Promise<{ app: Application, server: Server }>
    function run(root: string, port1: number, port2: number, ...ports: number[]): Promise<{ app: Application, servers: Server[] }>
}

export = MVC
