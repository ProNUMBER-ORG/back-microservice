import swaggerJsDoc, { Options } from "swagger-jsdoc";

const definitions: Options = {
    definition: {
        info: { title: "HACKATON API", version: "1.0", description: "<h3>The REST API documentation.</h3>" },
        openapi: "3.0.0",
        servers: [{ url: process.env.APP_DOMAIN }]
    },
    apis: [`${process.cwd()}/src/documents/**/*.yml`, `${process.cwd()}/src/documents/**/*.yaml`]
};

export default swaggerJsDoc(definitions);
