import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
} from 'axios';

export class AxiosClient {
    private static instance: AxiosClient;
    private client: AxiosInstance;

    private constructor(baseURL: string) {
        axios.defaults.timeout = 10_000;
        axios.defaults.withCredentials = true;
        axios.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';
        axios.defaults.headers.post['Accept'] = 'text/plain';

        this.client = axios.create({ baseURL })
    }

    public static getInstance(baseURL: string): AxiosClient {
        if (!AxiosClient.instance) {
            AxiosClient.instance = new AxiosClient(baseURL);
        }
        return AxiosClient.instance;
    }

    private async handleRequest<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
        try {
            const response = await request;
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw error;
            }
            throw new AxiosError(
                'Unexpected error occurred',
                'ERR_UNKNOWN',
                undefined,
                undefined,
                error as any,
            );
        }
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.handleRequest<T>(this.client.get<T>(url, config));
    }

    public async post<R, T>(url: string, data: R, config?: AxiosRequestConfig): Promise<T> {
        return this.handleRequest<T>(this.client.post<R, AxiosResponse<T>>(url, data, config));
    }

    public async put<R, T>(url: string, data: R, config?: AxiosRequestConfig): Promise<T> {
        return this.handleRequest<T>(this.client.put<R, AxiosResponse<T>>(url, data, config));
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.handleRequest<T>(this.client.delete<T>(url, config));
    }
}