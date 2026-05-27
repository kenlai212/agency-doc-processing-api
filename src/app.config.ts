export default () => ({
    nodeEnv: process.env.NODE_ENV || "PRODUCTION",
    useAuthGuard: process.env.USE_AUTH_GUARD || true,
    authApiUrl: process.env.AUTH_API_URL,
    port: parseInt(process.env.APP_PORT, 10) || 8080,
    database: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        userName: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        databaseName: process.env.DB_NAME,
        syncDb: process.env.DB_SYNC || false,
        logging: process.env.DB_LOGGING || false
    },
    kafka: {
        brokers: [process.env.KAFKA_BROKERS || "localhost:9092"]
    }
});