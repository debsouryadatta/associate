### Steps of Dev:

```
1. pnpm init
2. pnpm i express
3. pnpm i -D typescript tsx @types/express
4. Add the tsconfig.json

{
  "compilerOptions": {
    "module": "ESNext", // Use ESNext for ESM
    "target": "ES2020", // Target modern ECMAScript versions
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "outDir": "./dist", // Output directory for compiled files
    "strict": true, // Enable strict type-checking options
    "skipLibCheck": true, // Skip type checking of declaration files
    "resolveJsonModule": true, // Include JSON imports
    "forceConsistentCasingInFileNames": true,
    "noEmit": false, // Allow emitting output
    "isolatedModules": true, // Required for using ESM modules
    "baseUrl": ".", // Allow absolute imports relative to project root
    "paths": {
      "*": ["node_modules/*"]
    }
  }
}

5. create the Hello world express
6. Adding the below script to package.json
"scripts": {
"test": "echo \"Error: no test specified\" && exit 1",
"dev": "NODE_ENV=dev node --import=tsx --watch --env-file=.env src/app.ts",
"build": "tsc",
"start": "node dist/index.js",
"db:generate": "npx prisma generate",
"db:migrate": "npx prisma migrate dev",
"db:studio": "npx prisma studio"
},

7. Adding a .env file
8. Running pnpm run dev
9. pnpm i prisma
10. npx prisma init
11. Put the DATABASE_URL in the .env file
12. Add the db schema in the schema.prisma file
13. npx prisma migrate dev --name init
14. After trying with several approaches, finally decided not to deploy the be to vercel. May have issues with prisma and typescript
```