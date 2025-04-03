const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle', // 迁移文件存储目录
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL ?? ''
  },
  breakpoints: true
});
