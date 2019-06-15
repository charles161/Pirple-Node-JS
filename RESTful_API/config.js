// container for all the environments
var environments = {
    staging: {
        httpPort: 3000,
        httpsPort: 3001,
        name: "staging",
        hashingSecret: "sadkljfhlaksd"
    },
    production: {
        httpPort: 5000,
        httpsPort: 5001,
        name: "production",
        hashingSecret: "iuoyqweiuryowi"
    }
};
//console.log("envs: ", process.env);
var currentEnv =
    typeof process.env.NODE_ENV == "string" ? process.env.NODE_ENV : "staging";
var exportEnv =
    currentEnv == "production" ? environments.production : environments.staging;

module.exports = exportEnv;
