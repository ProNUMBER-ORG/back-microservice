import { boundClass } from "autobind-decorator";
import axios, { AxiosError } from "axios";
import { readFileSync } from "fs";
import { globalAgent } from "https";
import { uuidGenerate } from "../common/functions/generator";
import logger from "../core/logger";

@boundClass
class GigaChat {
    private readonly api = axios.create();

    private readonly authUrl = process.env.GIGACHAT_AUTH_URL;
    private readonly apiUrl = process.env.GIGACHAT_API_URL;

    private readonly scope = process.env.GIGACHAT_SCOPE;
    private readonly authKey = process.env.GIGACHAT_AUTH_KEY;
    private readonly clientId = process.env.GIGACHAT_CLIENT_ID;
    private readonly clientSecret = process.env.GIGACHAT_CLIENT_SECRET;

    private readonly rootCA = readFileSync("/app/certs/russian_trusted_root_ca_pem.crt");
    private readonly subCA = readFileSync("/app/certs/russian_trusted_sub_ca_pem.crt");

    private token: string;

    constructor() {
        globalAgent.options.ca = [this.rootCA, this.subCA];
        this.auth().then(() => this.getModels());
    }

    public async auth() {
        try {
            const authKey = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                RqUID: uuidGenerate(),
                Authorization: `Basic ${authKey}`
            };
            const response = await this.api.post<{ access_token: string; expires_at: number }>(
                `${this.authUrl}/v2/oauth`,
                { scope: this.scope },
                { headers }
            );

            this.token = response.data.access_token;
            logger.info({ module: "gigachat-api", msg: "Bearer token updated" });
        } catch (error: Error | AxiosError | any) {
            logger.error({ module: "gigachat-api", msg: error?.message || "Something went wrong" });
            console.log(error);
        }
    }

    public async getModels() {
        try {
            if (!this.token) throw new Error("Token not initialized");

            const headers = {
                Accept: "application/json",
                maxBodyLength: Infinity,
                RqUID: uuidGenerate(),
                Authorization: `Bearer ${this.token.trim()}`,
                "Content-Type": "application/json" // Явно указываем для GET
            };
            const response = await this.api.get(`${this.apiUrl}/v2/models`, { headers });
            console.log(response.data);
        } catch (error: Error | AxiosError | any) {
            logger.error({ module: "gigachat-api", msg: error?.message || "Something went wrong" });
            console.log(error);
        }
    }
}

export default new GigaChat();
