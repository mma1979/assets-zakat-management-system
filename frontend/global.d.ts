declare namespace NodeJS {
    interface ProcessEnv {
        API_KEY?: string;
        NOTIFICATION_EMAIL?: string;
        [key: string]: string | undefined;
    }
}

declare var process: {
    env: NodeJS.ProcessEnv;
};
